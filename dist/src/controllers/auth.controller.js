"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const user_repository_1 = require("../repositories/user.repository");
const session_repository_1 = require("../repositories/session.repository");
const audit_logs_repository_1 = require("../repositories/audit-logs.repository");
const otp_service_1 = require("../services/otp.service");
const email_service_1 = require("../services/email.service");
const logger_1 = require("../utils/logger");
const jwt_1 = require("../utils/jwt");
const userAgent_1 = require("../helpers/userAgent");
const errors_1 = require("../utils/errors");
const client_1 = require("../database/client");
// Input Validations
const signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: zod_1.z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    code: zod_1.z.string().length(6, 'OTP must be 6 digits'),
    type: zod_1.z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'SENSITIVE_ACTION']),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
const resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    code: zod_1.z.string().length(6, 'OTP must be 6 digits'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
});
class AuthController {
    async signup(req, res) {
        const { name, email, password } = signupSchema.parse(req.body);
        const existingUser = await user_repository_1.userRepository.findByEmail(email);
        if (existingUser) {
            throw new errors_1.ConflictError('Email address is already registered');
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Create user in transaction with default preferences and portfolio
        const user = await client_1.prisma.$transaction(async (tx) => {
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
        await otp_service_1.otpService.sendVerificationOtp(email, 'REGISTRATION');
        await audit_logs_repository_1.auditLogsRepository.create({
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
    async verifyOtp(req, res) {
        const { email, code, type } = verifyOtpSchema.parse(req.body);
        // Verify code (deletes it upon successful validation)
        await otp_service_1.otpService.verifyOtp(email, code, type);
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user) {
            throw new errors_1.BadRequestError('User record not found.');
        }
        // If registration, mark user email as verified
        if (type === 'REGISTRATION') {
            await user_repository_1.userRepository.update(user.id, { emailVerified: true });
            // Send welcome email asynchronously so it doesn't block the HTTP response
            email_service_1.emailService.sendWelcome(user.email, user.name || user.email.split('@')[0]).catch((err) => {
                logger_1.logger.error(`[EmailService] Failed to send Welcome email on registration: ${err.message}`);
            });
        }
        // Set up session
        const uaParsed = (0, userAgent_1.parseUserAgent)(req.headers['user-agent']);
        const sessionToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, role: user.role, email: user.email });
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const session = await session_repository_1.sessionRepository.create({
            user: { connect: { id: user.id } },
            token: sessionToken,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            device: uaParsed.device,
            expiresAt,
        });
        // Determine provider type
        const provider = user.provider || 'credentials';
        await user_repository_1.userRepository.update(user.id, {
            lastLoginAt: new Date(),
            provider,
        });
        // Update latest PENDING login history to SUCCESS
        const pendingLog = await client_1.prisma.loginHistory.findFirst({
            where: {
                userId: user.id,
                status: 'PENDING',
                provider,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (pendingLog) {
            await client_1.prisma.loginHistory.update({
                where: { id: pendingLog.id },
                data: {
                    status: 'SUCCESS',
                    sessionId: session.id,
                    otpVerifiedAt: new Date(),
                    loginTime: new Date(),
                },
            });
        }
        else {
            await client_1.prisma.loginHistory.create({
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
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, role: user.role, email: user.email });
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
    async login(req, res) {
        const { email, password } = loginSchema.parse(req.body);
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user || !user.passwordHash) {
            throw new errors_1.UnauthorizedError('Account not found.');
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!passwordMatch) {
            // Log failed attempt
            await client_1.prisma.loginHistory.create({
                data: {
                    user: { connect: { id: user.id } },
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    status: 'FAILED',
                    provider: 'credentials',
                },
            });
            throw new errors_1.UnauthorizedError('Incorrect password.');
        }
        if (user.status !== 'ACTIVE') {
            throw new errors_1.UnauthorizedError('Account is currently deactivated.');
        }
        if (!user.emailVerified) {
            throw new errors_1.UnauthorizedError('Account is not verified. Please verify your email.');
        }
        // Generate and send OTP (always required in the redesigned flow)
        await otp_service_1.otpService.sendVerificationOtp(email, 'LOGIN');
        // Parse User-Agent details
        const uaParsed = (0, userAgent_1.parseUserAgent)(req.headers['user-agent']);
        // Record PENDING login event
        await client_1.prisma.loginHistory.create({
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
    async resendOtp(req, res) {
        const { email, type } = zod_1.z.object({
            email: zod_1.z.string().email(),
            type: zod_1.z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'SENSITIVE_ACTION']),
        }).parse(req.body);
        await otp_service_1.otpService.sendVerificationOtp(email, type);
        return res.status(200).json({
            success: true,
            message: 'New authorization key dispatched.',
            data: null,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async logout(req, res) {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const session = await session_repository_1.sessionRepository.findByToken(refreshToken);
            if (session) {
                // Record session duration
                const durationSeconds = Math.round((Date.now() - session.createdAt.getTime()) / 1000);
                await session_repository_1.sessionRepository.deactivate(session.id);
                // Find associated login history to update logout time
                const latestHistory = await client_1.prisma.loginHistory.findFirst({
                    where: { userId: session.userId, status: 'SUCCESS' },
                    orderBy: { loginTime: 'desc' },
                });
                if (latestHistory) {
                    await client_1.prisma.loginHistory.update({
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
    async forgotPassword(req, res) {
        const { email } = forgotPasswordSchema.parse(req.body);
        const user = await user_repository_1.userRepository.findByEmail(email);
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
        await otp_service_1.otpService.sendVerificationOtp(email, 'PASSWORD_RESET');
        return res.status(200).json({
            success: true,
            message: 'Password reset OTP key dispatched to email.',
            data: null,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async resetPassword(req, res) {
        const { email, code, newPassword } = resetPasswordSchema.parse(req.body);
        // Verify OTP first
        await otp_service_1.otpService.verifyOtp(email, code, 'PASSWORD_RESET');
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user) {
            throw new errors_1.BadRequestError('User not found.');
        }
        const passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        await user_repository_1.userRepository.update(user.id, { passwordHash });
        await audit_logs_repository_1.auditLogsRepository.create({
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
    async googleLogin(req, res) {
        const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        const clientState = req.query.state || '';
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
    async googleCallback(req, res) {
        const { code, state } = req.query;
        const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8000').split(',');
        let targetOrigin = corsOrigins[0];
        // If state contains a valid origin from our allowed origins, use it
        if (state && typeof state === 'string' && state.startsWith('http')) {
            if (corsOrigins.includes(state)) {
                targetOrigin = state;
            }
        }
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || clientId === 'placeholder_google_client_id' || !clientSecret || clientSecret === 'placeholder_google_client_secret') {
            logger_1.logger.error('❌ [Google Auth Error] OAuth client configuration is missing or using placeholders. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.');
            return res.redirect(`${targetOrigin}/#/auth?error=OAuthConfigurationMissing`);
        }
        if (!code) {
            logger_1.logger.error('❌ [Google Auth Error] Authorization code is missing from the callback request.');
            return res.redirect(`${targetOrigin}/#/auth?error=CodeMissing`);
        }
        try {
            const tokenUrl = 'https://oauth2.googleapis.com/token';
            const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
            const values = {
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            };
            logger_1.logger.info(`[Google Auth] Attempting token exchange. Redirect URI: "${redirectUri}"`);
            const tokenRes = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(values),
            });
            if (!tokenRes.ok) {
                const errDetails = await tokenRes.text();
                logger_1.logger.error(`❌ [Google Auth Error] Token exchange failed with status ${tokenRes.status}. Details: ${errDetails}`);
                if (errDetails.includes('redirect_uri_mismatch')) {
                    logger_1.logger.error('❌ [Google Auth Hint] Redirect URI mismatch. Ensure your backend callback URL is whitelisted in Google Cloud Console.');
                    return res.redirect(`${targetOrigin}/#/auth?error=RedirectUriMismatch`);
                }
                if (errDetails.includes('invalid_grant')) {
                    logger_1.logger.error('❌ [Google Auth Hint] Authorization code has expired or was already used.');
                    return res.redirect(`${targetOrigin}/#/auth?error=AuthCodeExpired`);
                }
                return res.redirect(`${targetOrigin}/#/auth?error=TokenExchangeFailed`);
            }
            const { id_token, access_token } = (await tokenRes.json());
            const userInfoUrl = `https://www.googleapis.com/oauth2/v3/userinfo?alt=json&access_token=${access_token}`;
            const userRes = await fetch(userInfoUrl, {
                headers: { Authorization: `Bearer ${id_token}` },
            });
            if (!userRes.ok) {
                const errDetails = await userRes.text();
                logger_1.logger.error(`❌ [Google Auth Error] Fetching user profile from Google failed with status ${userRes.status}. Details: ${errDetails}`);
                return res.redirect(`${targetOrigin}/#/auth?error=FetchUserInfoFailed`);
            }
            const googleUser = (await userRes.json());
            let user = await user_repository_1.userRepository.findByGoogleId(googleUser.sub);
            if (!user) {
                user = await user_repository_1.userRepository.findByEmail(googleUser.email);
                if (user) {
                    user = await user_repository_1.userRepository.update(user.id, {
                        googleId: googleUser.sub,
                        avatarUrl: googleUser.picture,
                        emailVerified: true,
                        provider: 'google',
                    });
                }
                else {
                    user = await client_1.prisma.$transaction(async (tx) => {
                        const newUser = await tx.user.create({
                            data: {
                                email: googleUser.email,
                                name: googleUser.name,
                                googleId: googleUser.sub,
                                avatarUrl: googleUser.picture,
                                emailVerified: true,
                                provider: 'google',
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
            const uaParsed = (0, userAgent_1.parseUserAgent)(req.headers['user-agent']);
            // Recognized/Google Verified User -> Log in immediately (bypassing local OTP check)
            const sessionToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, role: user.role, email: user.email });
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const session = await session_repository_1.sessionRepository.create({
                user: { connect: { id: user.id } },
                token: sessionToken,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                device: uaParsed.device,
                expiresAt,
            });
            await user_repository_1.userRepository.update(user.id, {
                lastLoginAt: new Date(),
                provider: 'google',
            });
            await client_1.prisma.loginHistory.create({
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
            const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, role: user.role, email: user.email });
            res.cookie('refreshToken', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            logger_1.logger.info(`✅ [Google Auth] Session successfully initialized for [${user.email}]`);
            return res.redirect(`${targetOrigin}/#/auth?token=${accessToken}`);
        }
        catch (err) {
            logger_1.logger.error('❌ [Google Auth Error] Unexpected failure during Google OAuth process:', err);
            if (err.code === 'ENOTFOUND' || err.message.includes('fetch')) {
                logger_1.logger.error('   -> Hint: Network connection failure to Google services.');
                return res.redirect(`${targetOrigin}/#/auth?error=NetworkError`);
            }
            return res.redirect(`${targetOrigin}/#/auth?error=OAuthCallbackError`);
        }
    }
    async checkSession(req, res) {
        // If auth middleware succeeds, user is already attached to req
        const user = req.user;
        const userRecord = await user_repository_1.userRepository.findById(user.userId);
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
    async getGoogleConfig(_req, res) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const hasClientId = !!clientId && clientId !== 'placeholder_google_client_id';
        const hasClientSecret = !!clientSecret && clientSecret !== 'placeholder_google_client_secret';
        if (!hasClientId || !hasClientSecret) {
            let errorMsg = 'Google OAuth is not configured on the server. ';
            if (!hasClientId)
                errorMsg += 'GOOGLE_CLIENT_ID is missing or set to placeholder. ';
            if (!hasClientSecret)
                errorMsg += 'GOOGLE_CLIENT_SECRET is missing or set to placeholder. ';
            return res.status(200).json({
                success: true,
                data: {
                    configured: false,
                    error: errorMsg
                }
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                configured: true,
                clientId
            }
        });
    }
    async verifyGoogleToken(req, res) {
        const { token } = zod_1.z.object({
            token: zod_1.z.string().min(1, 'Token is required')
        }).parse(req.body);
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || clientId === 'placeholder_google_client_id' ||
            !clientSecret || clientSecret === 'placeholder_google_client_secret') {
            throw new errors_1.BadRequestError('Google Authentication is not configured on the server.');
        }
        // Verify token with Google API
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (!tokenInfoRes.ok) {
            throw new errors_1.UnauthorizedError('Failed to verify Google Identity Token.');
        }
        const payload = await tokenInfoRes.json();
        // Validate audience and issuer
        if (payload.aud !== clientId) {
            throw new errors_1.UnauthorizedError('Google Identity Token audience mismatch.');
        }
        if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
            throw new errors_1.UnauthorizedError('Google Identity Token issuer is invalid.');
        }
        const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
        // Find or create user
        let user = await user_repository_1.userRepository.findByGoogleId(payload.sub);
        if (!user) {
            user = await user_repository_1.userRepository.findByEmail(payload.email);
            if (user) {
                // Link existing email account to Google ID
                user = await user_repository_1.userRepository.update(user.id, {
                    googleId: payload.sub,
                    avatarUrl: payload.picture || user.avatarUrl,
                    emailVerified: true,
                    provider: 'google'
                });
            }
            else {
                // Create new account
                user = await client_1.prisma.$transaction(async (tx) => {
                    const newUser = await tx.user.create({
                        data: {
                            email: payload.email,
                            name: payload.name,
                            googleId: payload.sub,
                            avatarUrl: payload.picture || null,
                            emailVerified: emailVerified,
                            provider: 'google'
                        }
                    });
                    await tx.userPreferences.create({
                        data: {
                            userId: newUser.id,
                            theme: 'dark'
                        }
                    });
                    await tx.portfolio.create({
                        data: {
                            userId: newUser.id,
                            name: 'Primary Portfolio',
                            cashBalance: 100000
                        }
                    });
                    return newUser;
                });
            }
        }
        const uaParsed = (0, userAgent_1.parseUserAgent)(req.headers['user-agent']);
        const sessionToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, role: user.role, email: user.email });
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const session = await session_repository_1.sessionRepository.create({
            user: { connect: { id: user.id } },
            token: sessionToken,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            device: uaParsed.device,
            expiresAt,
        });
        await user_repository_1.userRepository.update(user.id, {
            lastLoginAt: new Date(),
            provider: 'google'
        });
        // Store login history
        await client_1.prisma.loginHistory.create({
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
                loginTime: new Date(),
                otpVerifiedAt: new Date()
            }
        });
        await audit_logs_repository_1.auditLogsRepository.create({
            user: { connect: { id: user.id } },
            action: 'Google Login',
            details: `User logged in using Google OAuth (IP: ${req.ip})`,
            ipAddress: req.ip,
        });
        // Generate access token
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, role: user.role, email: user.email });
        // Set HttpOnly secure cookie for session token
        res.cookie('refreshToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            success: true,
            message: 'Google login successful. Session authorized.',
            data: {
                accessToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatarUrl: user.avatarUrl
                }
            },
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-'
        });
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
exports.default = exports.authController;
