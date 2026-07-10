import { Response } from 'express';
import { CustomRequest } from '../middlewares/requestId';
import { sessionRepository } from '../repositories/session.repository';
import { prisma } from '../database/client';
import { z } from 'zod';
import { parseUserAgent } from '../helpers/userAgent';

export class UserController {
  async getSessions(req: CustomRequest, res: Response): Promise<Response> {
    const user = (req as any).user;
    const currentToken = req.cookies.refreshToken;
    const activeSessions = await sessionRepository.findActiveByUserId(user.userId);

    const formatted = activeSessions.map((session) => {
      const ua = parseUserAgent(session.userAgent || undefined);
      return {
        id: session.id,
        ipAddress: session.ipAddress,
        device: session.device || ua.device,
        browser: ua.browser,
        os: ua.os,
        lastActivity: session.lastActivity,
        isCurrent: session.token === currentToken,
        createdAt: session.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Active sessions retrieved successfully.',
      data: formatted,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async logoutSession(req: CustomRequest, res: Response): Promise<Response> {
    const { sessionId } = z.object({ sessionId: z.string().uuid() }).parse(req.body);
    const user = (req as any).user;

    const session = await sessionRepository.findById(sessionId);
    if (!session || session.userId !== user.userId) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or authorization denied.',
        data: null,
      });
    }

    await sessionRepository.deactivate(sessionId);

    return res.status(200).json({
      success: true,
      message: 'Session terminated successfully.',
      data: null,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async logoutAllOtherSessions(req: CustomRequest, res: Response): Promise<Response> {
    const user = (req as any).user;
    const currentToken = req.cookies.refreshToken;

    const currentSession = await sessionRepository.findByToken(currentToken);
    if (!currentSession) {
      return res.status(401).json({
        success: false,
        message: 'Current session context is invalid.',
        data: null,
      });
    }

    await sessionRepository.deactivateAllOther(user.userId, currentSession.id);

    return res.status(200).json({
      success: true,
      message: 'All other active sessions revoked.',
      data: null,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async getPreferences(req: CustomRequest, res: Response): Promise<Response> {
    const user = (req as any).user;
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: user.userId },
    });

    return res.status(200).json({
      success: true,
      message: 'Preferences retrieved.',
      data: prefs,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async updatePreferences(req: CustomRequest, res: Response): Promise<Response> {
    const user = (req as any).user;
    const { theme, enableNotifications } = z.object({
      theme: z.enum(['light', 'dark']).optional(),
      enableNotifications: z.boolean().optional(),
    }).parse(req.body);

    const updated = await prisma.userPreferences.update({
      where: { userId: user.userId },
      data: {
        theme,
        enableNotifications,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      data: updated,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }
}

export const userController = new UserController();
export default userController;
