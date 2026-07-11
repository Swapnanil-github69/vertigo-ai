import { sessionRepository } from '../repositories/session.repository';
import { prisma } from '../database/client';
import { parseUserAgent } from '../helpers/userAgent';

export interface ActiveSessionResponse {
  id: string;
  ipAddress: string | null;
  device: string;
  browser: string;
  os: string;
  location: string;
  loginTime: Date;
  provider: string;
  isCurrent: boolean;
  createdAt: Date;
}

export class SessionService {
  async getActiveSessions(userId: string, currentToken: string): Promise<ActiveSessionResponse[]> {
    const sessions = await sessionRepository.findActiveByUserId(userId);
    
    // Fetch login histories for these session IDs to get provider/loginTime
    const sessionIds = sessions.map(s => s.id);
    const histories = await prisma.loginHistory.findMany({
      where: { sessionId: { in: sessionIds } },
    });

    const historyMap = new Map(histories.map(h => [h.sessionId, h]));

    return sessions.map((session) => {
      const ua = parseUserAgent(session.userAgent || undefined);
      const history = historyMap.get(session.id);
      
      return {
        id: session.id,
        ipAddress: session.ipAddress,
        device: session.device || ua.device,
        browser: ua.browser,
        os: ua.os,
        location: 'Local Loop' , // Optional location, default to Local Loop or Unknown
        loginTime: history?.loginTime || session.createdAt,
        provider: history?.provider || 'credentials',
        isCurrent: session.token === currentToken,
        createdAt: session.createdAt,
      };
    });
  }

  async logoutSession(userId: string, sessionId: string): Promise<boolean> {
    const session = await sessionRepository.findById(sessionId);
    if (!session || session.userId !== userId) {
      return false;
    }
    await sessionRepository.deactivate(sessionId);

    // Update login history logout time
    await prisma.loginHistory.updateMany({
      where: { sessionId, logoutTime: null },
      data: { logoutTime: new Date() },
    });

    return true;
  }

  async logoutAllOtherSessions(userId: string, currentToken: string): Promise<boolean> {
    const currentSession = await sessionRepository.findByToken(currentToken);
    if (!currentSession || currentSession.userId !== userId) {
      return false;
    }

    await sessionRepository.deactivateAllOther(userId, currentSession.id);

    // Update all other success login histories with logout time
    await prisma.loginHistory.updateMany({
      where: {
        userId,
        sessionId: { not: currentSession.id },
        logoutTime: null,
      },
      data: { logoutTime: new Date() },
    });

    return true;
  }
}

export const sessionService = new SessionService();
export default sessionService;
