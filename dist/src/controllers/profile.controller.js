"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileController = exports.ProfileController = void 0;
const profile_service_1 = require("../services/profile.service");
const session_service_1 = require("../services/session.service");
const google_sync_service_1 = require("../services/google-sync.service");
const profile_validator_1 = require("../validators/profile.validator");
const errors_1 = require("../utils/errors");
const zod_1 = require("zod");
class ProfileController {
    async getProfile(req, res) {
        const userContext = req.user;
        const profile = await profile_service_1.profileService.getProfile(userContext.userId);
        return res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully.',
            data: profile,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async updateProfile(req, res) {
        const userContext = req.user;
        const validatedData = profile_validator_1.updateProfileSchema.parse(req.body);
        const profile = await profile_service_1.profileService.updateProfile(userContext.userId, validatedData);
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            data: profile,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async uploadAvatar(req, res) {
        const userContext = req.user;
        if (!req.file) {
            throw new errors_1.BadRequestError('No image file provided.');
        }
        const profile = await profile_service_1.profileService.uploadAvatar(userContext.userId, req.file.filename);
        return res.status(200).json({
            success: true,
            message: 'Profile picture uploaded successfully.',
            data: { avatarUrl: profile.avatarUrl, profileCompletion: profile.profileCompletion },
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async deleteAvatar(req, res) {
        const userContext = req.user;
        const profile = await profile_service_1.profileService.deleteAvatar(userContext.userId);
        return res.status(200).json({
            success: true,
            message: 'Profile picture deleted successfully.',
            data: { avatarUrl: profile.avatarUrl, profileCompletion: profile.profileCompletion },
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async revertAvatar(req, res) {
        const userContext = req.user;
        const profile = await profile_service_1.profileService.revertAvatar(userContext.userId);
        return res.status(200).json({
            success: true,
            message: 'Profile picture reverted to Google profile picture.',
            data: { avatarUrl: profile.avatarUrl, profileCompletion: profile.profileCompletion },
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async syncGoogleProfile(req, res) {
        const { token } = zod_1.z.object({
            token: zod_1.z.string().min(1, 'Identity token required for synchronization.')
        }).parse(req.body);
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (!tokenInfoRes.ok) {
            throw new errors_1.UnauthorizedError('Failed to verify Google Identity Token.');
        }
        const payload = await tokenInfoRes.json();
        const syncedUser = await google_sync_service_1.googleSyncService.syncGoogleUser(payload);
        return res.status(200).json({
            success: true,
            message: 'Google profile synchronized successfully.',
            data: syncedUser,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async getActiveSessions(req, res) {
        const userContext = req.user;
        const currentToken = req.cookies.refreshToken;
        const sessions = await session_service_1.sessionService.getActiveSessions(userContext.userId, currentToken);
        return res.status(200).json({
            success: true,
            message: 'Active sessions retrieved successfully.',
            data: sessions,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async logoutSession(req, res) {
        const userContext = req.user;
        const { sessionId } = zod_1.z.object({ sessionId: zod_1.z.string().uuid() }).parse(req.body);
        const success = await session_service_1.sessionService.logoutSession(userContext.userId, sessionId);
        if (!success) {
            throw new errors_1.BadRequestError('Session not found or authorization denied.');
        }
        return res.status(200).json({
            success: true,
            message: 'Session terminated successfully.',
            data: null,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async logoutAllSessions(req, res) {
        const userContext = req.user;
        const currentToken = req.cookies.refreshToken;
        const success = await session_service_1.sessionService.logoutAllOtherSessions(userContext.userId, currentToken);
        if (!success) {
            throw new errors_1.BadRequestError('Current session invalid.');
        }
        return res.status(200).json({
            success: true,
            message: 'All other active sessions revoked.',
            data: null,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async deleteAccount(req, res) {
        const userContext = req.user;
        await profile_service_1.profileService.deleteAccount(userContext.userId);
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
exports.ProfileController = ProfileController;
exports.profileController = new ProfileController();
exports.default = exports.profileController;
