"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const session_repository_1 = require("../repositories/session.repository");
const client_1 = require("../database/client");
const zod_1 = require("zod");
const userAgent_1 = require("../helpers/userAgent");
class UserController {
    async getSessions(req, res) {
        const user = req.user;
        const currentToken = req.cookies.refreshToken;
        const activeSessions = await session_repository_1.sessionRepository.findActiveByUserId(user.userId);
        const formatted = activeSessions.map((session) => {
            const ua = (0, userAgent_1.parseUserAgent)(session.userAgent || undefined);
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
    async logoutSession(req, res) {
        const { sessionId } = zod_1.z.object({ sessionId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID format') }).parse(req.body);
        const user = req.user;
        const session = await session_repository_1.sessionRepository.findById(sessionId);
        if (!session || session.userId !== user.userId) {
            return res.status(404).json({
                success: false,
                message: 'Session not found or authorization denied.',
                data: null,
            });
        }
        await session_repository_1.sessionRepository.deactivate(sessionId);
        return res.status(200).json({
            success: true,
            message: 'Session terminated successfully.',
            data: null,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async logoutAllOtherSessions(req, res) {
        const user = req.user;
        const currentToken = req.cookies.refreshToken;
        const currentSession = await session_repository_1.sessionRepository.findByToken(currentToken);
        if (!currentSession) {
            return res.status(401).json({
                success: false,
                message: 'Current session context is invalid.',
                data: null,
            });
        }
        await session_repository_1.sessionRepository.deactivateAllOther(user.userId, currentSession.id);
        return res.status(200).json({
            success: true,
            message: 'All other active sessions revoked.',
            data: null,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async getPreferences(req, res) {
        const user = req.user;
        const prefs = await client_1.prisma.userPreferences.findUnique({
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
    async updatePreferences(req, res) {
        const user = req.user;
        const { theme, enableNotifications } = zod_1.z.object({
            theme: zod_1.z.enum(['light', 'dark']).optional(),
            enableNotifications: zod_1.z.boolean().optional(),
        }).parse(req.body);
        const updated = await client_1.prisma.userPreferences.update({
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
exports.UserController = UserController;
exports.userController = new UserController();
exports.default = exports.userController;
