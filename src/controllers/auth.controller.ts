import { Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { CustomRequest } from '../middlewares/requestId';
import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { auditLogsRepository } from '../repositories/audit-logs.repository';
import { otpService } from '../services/otp.service';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { parseUserAgent } from '../helpers/userAgent';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { prisma } from '../database/client';

// Input Validations
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP must be 6 digits'),
  type: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'SENSITIVE_ACTION']),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export class AuthController {
  async signup(req: CustomRequest, res: Response): Promise<Response> {
    const { name, email, password } = signupSchema.parse(req.body);

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email address is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in transaction with default preferences and portfolio
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          emailVerified: false,
        },
      });

      // Default user preferences
      await tx.userPreferences.create({
        data: {
          userId: newUser.id,
          theme: 'dark',
        },
      });

      // Default primary portfolio
      await tx.portfolio.create({
        data: {
          userId: newUser.id,
          name: 'Primary Portfolio',
          cashBalance: 100000, // Start with $100k sandbox cash
        },
      });

      return newUser;
    });

    // Send registration OTP
    await otpService.sendVerificationOtp(email, 'REGISTRATION');

    await auditLogsRepository.create({
      user: { connect: { id: user.id } },
      action: 'Account Created',
      details: `Account created for ${email} (verification pending)`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration initiated. OTP code sent to your email.',
      data: { otpRequired: true, email },
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async verifyOtp(req: CustomRequest, res: Response): Promise<Response> {
    const { email, code, type } = verifyOtpSchema.parse(req.body);

    // Verify code (deletes it upon successful validation)
    await otpService.verifyOtp(email, code, type);

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestError('User record not found.');
    }

    // If registration, mark user email as verified
    if (type === 'REGISTRATION') {
      await userRepository.update(user.id, { emailVerified: true });
    }

    // Set up session
    const uaParsed = parseUserAgent(req.headers['user-agent']);
    const sessionToken = generateRefreshToken({ userId: user.id, role: user.role, email: user.email });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await sessionRepository.create({
      user: { connect: { id: user.id } },
      token: sessionToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      device: uaParsed.device,
      expiresAt,
    });

    // Determine provider type
    const provider = user.provider || 'credentials';

    await userRepository.update(user.id, {
      lastLoginAt: new Date(),
      provider,
    });

    // Update latest PENDING login history to SUCCESS
    const pendingLog = await prisma.loginHistory.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING',
        provider,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingLog) {
      await prisma.loginHistory.update({
        where: { id: pendingLog.id },
        data: {
          status: 'SUCCESS',
          sessionId: session.id,
          otpVerifiedAt: new Date(),
          loginTime: new Date(),
        },
      });
    } else {
      await prisma.loginHistory.create({
        data: {
          user: { connect: { id: user.id } },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          os: uaParsed.os,
          browser: uaParsed.browser,
          device: uaParsed.device,
          sessionId: session.id,
          provider,
          otpGeneratedAt: new Date(), // fallback
          otpVerifiedAt: new Date(),
          loginTime: new Date(),
          status: 'SUCCESS',
        },
      });
    }

    // Generate access token
    const accessToken = generateAccessToken({ userId: user.id, role: user.role, email: user.email });

    // Set HttpOnly secure cookie for session token
    res.cookie('refreshToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Session authorized.',
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async login(req: CustomRequest, res: Response): Promise<Response> {
    const { email, password } = loginSchema.parse(req.body);

    const user = await userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Account not found.');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      // Log failed attempt
      await prisma.loginHistory.create({
        data: {
          user: { connect: { id: user.id } },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'FAILED',
          provider: 'credentials',
        },
      });
      throw new UnauthorizedError('Incorrect password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is currently deactivated.');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedError('Account is not verified. Please verify your email.');
    }

    // Generate and send OTP (always required in the redesigned flow)
    await otpService.sendVerificationOtp(email, 'LOGIN');

    // Parse User-Agent details
    const uaParsed = parseUserAgent(req.headers['user-agent']);

    // Record PENDING login event
    await prisma.loginHistory.create({
      data: {
        user: { connect: { id: user.id } },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        os: uaParsed.os,
        browser: uaParsed.browser,
        device: uaParsed.device,
        provider: 'credentials',
        otpGeneratedAt: new Date(),
        status: 'PENDING',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Verification OTP sent to your email.',
      data: { otpRequired: true, email },
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async resendOtp(req: CustomRequest, res: Response): Promise<Response> {
    const { email, type } = z.object({
      email: z.string().email(),
      type: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'SENSITIVE_ACTION']),
    }).parse(req.body);

    await otpService.sendVerificationOtp(email, type);

    return res.status(200).json({
      success: true,
      message: 'New authorization key dispatched.',
      data: null,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async logout(req: CustomRequest, res: Response): Promise<Response> {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const session = await sessionRepository.findByToken(refreshToken);
      if (session) {
        // Record session duration
        const durationSeconds = Math.round((Date.now() - session.createdAt.getTime()) / 1000);
        await sessionRepository.deactivate(session.id);

        // Find associated login history to update logout time
        const latestHistory = await prisma.loginHistory.findFirst({
          where: { userId: session.userId, status: 'SUCCESS' },
          orderBy: { loginTime: 'desc' },
        });

        if (latestHistory) {
          await prisma.loginHistory.update({
            where: { id: latestHistory.id },
            data: {
              logoutTime: new Date(),
              sessionDurationSeconds: durationSeconds,
            },
          });
        }
      }
    }

    res.clearCookie('refreshToken');
    return res.status(200).json({
      success: true,
      message: 'Session terminated. Access cookies cleared.',
      data: null,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async forgotPassword(req: CustomRequest, res: Response): Promise<Response> {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Prevent user enumeration by acting as if email was sent
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset vector has been sent.',
        data: null,
        timestamp: new Date().toISOString(),
        requestId: req.requestId || '-',
      });
    }

    await otpService.sendVerificationOtp(email, 'PASSWORD_RESET');

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP key dispatched to email.',
      data: null,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async resetPassword(req: CustomRequest, res: Response): Promise<Response> {
    const { email, code, newPassword } = resetPasswordSchema.parse(req.body);

    // Verify OTP first
    await otpService.verifyOtp(email, code, 'PASSWORD_RESET');

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestError('User not found.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.update(user.id, { passwordHash });

    await auditLogsRepository.create({
      user: { connect: { id: user.id } },
      action: 'Password Reset',
      details: 'Password was updated using verified OTP vector.',
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. Please log in.',
      data: null,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async googleLogin(req: CustomRequest, res: Response): Promise<void> {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const clientState = req.query.state as string || '';
    const options = {
      redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
      client_id: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
      state: clientState,
    };
    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
  }

  async googleCallback(req: CustomRequest, res: Response): Promise<void> {
    const { code, state } = req.query;
    const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8000').split(',');
    let targetOrigin = corsOrigins[0];

    // If state contains a valid origin from our allowed origins, use it
    if (state && typeof state === 'string' && state.startsWith('http')) {
      if (corsOrigins.includes(state)) {
        targetOrigin = state;
      }
    }

    if (!code) {
      return res.redirect(`${targetOrigin}/#/auth?error=CodeMissing`);
    }

    try {
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const values = {
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      };

      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(values),
      });

      if (!tokenRes.ok) {
        return res.redirect(`${targetOrigin}/#/auth?error=TokenExchangeFailed`);
      }

      const { id_token, access_token } = (await tokenRes.json()) as { id_token: string; access_token: string };

      const userInfoUrl = `https://www.googleapis.com/oauth2/v3/userinfo?alt=json&access_token=${access_token}`;
      const userRes = await fetch(userInfoUrl, {
        headers: { Authorization: `Bearer ${id_token}` },
      });

      if (!userRes.ok) {
        return res.redirect(`${targetOrigin}/#/auth?error=FetchUserInfoFailed`);
      }

      const googleUser = (await userRes.json()) as { sub: string; name: string; email: string; picture: string };

      let user = await userRepository.findByGoogleId(googleUser.sub);
      if (!user) {
        user = await userRepository.findByEmail(googleUser.email);
        if (user) {
          user = await userRepository.update(user.id, {
            googleId: googleUser.sub,
            avatarUrl: googleUser.picture,
            emailVerified: true,
          });
        } else {
          user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                email: googleUser.email,
                name: googleUser.name,
                googleId: googleUser.sub,
                avatarUrl: googleUser.picture,
                emailVerified: true,
              },
            });

            await tx.userPreferences.create({
              data: {
                userId: newUser.id,
                theme: 'dark',
              },
            });

            await tx.portfolio.create({
              data: {
                userId: newUser.id,
                name: 'Primary Portfolio',
                cashBalance: 100000,
              },
            });

            return newUser;
          });
        }
      }

      const uaParsed = parseUserAgent(req.headers['user-agent']);

      // Perform Risk Assessment: Check if successful history exists for this IP/UA
      const existingLog = await prisma.loginHistory.findFirst({
        where: {
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'SUCCESS',
        },
      });

      if (!existingLog) {
        // Unrecognized device/location -> Require OTP!
        await otpService.sendVerificationOtp(user.email, 'LOGIN');

        // Create PENDING login log
        await prisma.loginHistory.create({
          data: {
            user: { connect: { id: user.id } },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            os: uaParsed.os,
            browser: uaParsed.browser,
            device: uaParsed.device,
            provider: 'google',
            otpGeneratedAt: new Date(),
            status: 'PENDING',
          },
        });

        // Set provider info on user record
        await userRepository.update(user.id, {
          provider: 'google',
        });

        // Redirect to OTP verification page
        return res.redirect(`${targetOrigin}/#/auth?otpRequired=true&email=${encodeURIComponent(user.email)}&provider=google`);
      }

      // Recognized device -> Log in immediately!
      const sessionToken = generateRefreshToken({ userId: user.id, role: user.role, email: user.email });
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const session = await sessionRepository.create({
        user: { connect: { id: user.id } },
        token: sessionToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        device: uaParsed.device,
        expiresAt,
      });

      await userRepository.update(user.id, {
        lastLoginAt: new Date(),
        provider: 'google',
      });

      await prisma.loginHistory.create({
        data: {
          user: { connect: { id: user.id } },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          os: uaParsed.os,
          browser: uaParsed.browser,
          device: uaParsed.device,
          sessionId: session.id,
          provider: 'google',
          status: 'SUCCESS',
        },
      });

      const accessToken = generateAccessToken({ userId: user.id, role: user.role, email: user.email });

      res.cookie('refreshToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${targetOrigin}/#/auth?token=${accessToken}`);
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      return res.redirect(`${targetOrigin}/#/auth?error=OAuthCallbackError`);
    }
  }

  async checkSession(req: CustomRequest, res: Response): Promise<Response> {
    // If auth middleware succeeds, user is already attached to req
    const user = (req as any).user;
    const userRecord = await userRepository.findById(user.userId);
    return res.status(200).json({
      success: true,
      message: 'Session is active and valid.',
      data: {
        user: {
          id: user.userId,
          name: userRecord?.name || user.email.split('@')[0],
          email: user.email,
          role: user.role,
          avatarUrl: userRecord?.avatarUrl || null,
        },
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }
}

export const authController = new AuthController();
export default authController;
