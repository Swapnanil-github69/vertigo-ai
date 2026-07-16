import { Response } from 'express';
import { CustomRequest } from '../middlewares/requestId';
import { profileService } from '../services/profile.service';
import { sessionService } from '../services/session.service';
import { googleSyncService } from '../services/google-sync.service';
import { updateProfileSchema } from '../validators/profile.validator';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { z } from 'zod';

export class ProfileController {
  async getProfile(req: CustomRequest, res: Response): Promise<Response> {
    const userContext = (req as any).user;
    const profile = await profileService.getProfile(userContext.userId);

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully.',
      data: profile,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async updateProfile(req: CustomRequest, res: Response): Promise<Response> {
    const userContext = (req as any).user;
    const validatedData = updateProfileSchema.parse(req.body);
    const profile = await profileService.updateProfile(userContext.userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: profile,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async uploadAvatar(req: CustomRequest, res: Response): Promise<Response> {
    const userContext = (req as any).user;
    if (!req.file) {
      throw new BadRequestError('No image file provided.');
    }

    const profile = await profileService.uploadAvatar(userContext.userId, req.file.filename);

    return res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully.',
      data: { avatarUrl: profile.avatarUrl, profileCompletion: profile.profileCompletion },
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async deleteAvatar(req: CustomRequest, res: Response): Promise<Response> {
    const userContext = (req as any).user;
    const profile = await profileService.deleteAvatar(userContext.userId);

    return res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully.',
      data: { avatarUrl: profile.avatarUrl, profileCompletion: profile.profileCompletion },
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async revertAvatar(req: CustomRequest, res: Response): Promise<Response> {
    const userContext = (req as any).user;
    const profile = await profileService.revertAvatar(userContext.userId);

    return res.status(200).json({
      success: true,
      message: 'Profile picture reverted to Google profile picture.',
      data: { avatarUrl: profile.avatarUrl, profileCompletion: profile.profileCompletion },
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async syncGoogleProfile(req: CustomRequest, res: Response): Promise<Response> {
    const { token } = z.object({
      token: z.string().min(1, 'Identity token required for synchronization.')
    }).parse(req.body);

    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!tokenInfoRes.ok) {
      throw new UnauthorizedError('Failed to verify Google Identity Token.');
    }

    const payload = await tokenInfoRes.json() as {
      sub: string;
      email: string;
      email_verified: string | boolean;
      name: string;
      picture?: string;
      given_name?: string;
      family_name?: string;
      locale?: string;
    };

    const syncedUser = await googleSyncService.syncGoogleUser(payload);

    return res.status(200).json({
      success: true,
      message: 'Google profile synchronized successfully.',
      data: syncedUser,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async getActiveSessions(req: CustomRequest, res: Response): Promise<Response> {
    const userContext = (req as any).user;
    const currentToken = req.cookies.refreshToken;
    const sessions = await sessionService.getActiveSessions(userContext.userId, currentToken);

    return res.status(200).json({
      success: true,
      message: 'Active sessions retrieved successfully.',
      data: sessions,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async logoutSession(req: CustomRequest, res: Response): Promise<Response> {
    const userContext = (req as any).user;
    const { sessionId } = z.object({ sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID format') }).parse(req.body);

    const success = await sessionService.logoutSession(userContext.userId, sessionId);
    if (!success) {
      throw new BadRequestError('Session not found or authorization denied.');
    }

    return res.status(200).json({
      success: true,
      message: 'Session terminated successfully.',
      data: null,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async logoutAllSessions(req: CustomRequest, res: Response): Promise<Response> {
    const userContext = (req as any).user;
    const currentToken = req.cookies.refreshToken;

    const success = await sessionService.logoutAllOtherSessions(userContext.userId, currentToken);
    if (!success) {
      throw new BadRequestError('Current session invalid.');
    }

    return res.status(200).json({
      success: true,
      message: 'All other active sessions revoked.',
      data: null,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async deleteAccount(req: CustomRequest, res: Response): Promise<Response> {
    const userContext = (req as any).user;
    await profileService.deleteAccount(userContext.userId);

    res.clearCookie('refreshToken');

    return res.status(200).json({
      success: true,
      message: 'Account and associated clearance profiles deleted completely.',
      data: null,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }
}

export const profileController = new ProfileController();
export default profileController;
