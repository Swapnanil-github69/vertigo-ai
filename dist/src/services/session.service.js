"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const session_repository_1 = require("../repositories/session.repository");
const client_1 = require("../database/client");
const userAgent_1 = require("../helpers/userAgent");
class SessionService {
    async getActiveSessions(userId, currentToken) {
        const sessions = await session_repository_1.sessionRepository.findActiveByUserId(userId);
        // Fetch login histories for these session IDs to get provider/loginTime
        const sessionIds = sessions.map(s => s.id);
        const histories = await client_1.prisma.loginHistory.findMany({
            where: { sessionId: { in: sessionIds } },
        });
        const historyMap = new Map(histories.map(h => [h.sessionId, h]));
        return sessions.map((session) => {
            const ua = (0, userAgent_1.parseUserAgent)(session.userAgent || undefined);
            const history = historyMap.get(session.id);
            return {
                id: session.id,
                ipAddress: session.ipAddress,
                device: session.device || ua.device,
                browser: ua.browser,
                os: ua.os,
                location: 'Local Loop', // Optional location, default to Local Loop or Unknown
                loginTime: history?.loginTime || session.createdAt,
                provider: history?.provider || 'credentials',
                isCurrent: session.token === currentToken,
                createdAt: session.createdAt,
            };
        });
    }
    async logoutSession(userId, sessionId) {
        const session = await session_repository_1.sessionRepository.findById(sessionId);
        if (!session || session.userId !== userId) {
            return false;
        }
        await session_repository_1.sessionRepository.deactivate(sessionId);
        // Update login history logout time
        await client_1.prisma.loginHistory.updateMany({
            where: { sessionId, logoutTime: null },
            data: { logoutTime: new Date() },
        });
        return true;
    }
    async logoutAllOtherSessions(userId, currentToken) {
        const currentSession = await session_repository_1.sessionRepository.findByToken(currentToken);
        if (!currentSession || currentSession.userId !== userId) {
            return false;
        }
        await session_repository_1.sessionRepository.deactivateAllOther(userId, currentSession.id);
        // Update all other success login histories with logout time
        await client_1.prisma.loginHistory.updateMany({
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
exports.SessionService = SessionService;
exports.sessionService = new SessionService();
exports.default = exports.sessionService;
