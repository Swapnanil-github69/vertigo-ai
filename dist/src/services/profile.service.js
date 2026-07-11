"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileService = exports.ProfileService = void 0;
exports.calculateProfileCompletion = calculateProfileCompletion;
const user_repository_1 = require("../repositories/user.repository");
const errors_1 = require("../utils/errors");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function calculateProfileCompletion(user) {
    let score = 0;
    if (user.name && user.name.trim() !== '')
        score += 12.5;
    if (user.email && user.email.trim() !== '')
        score += 12.5;
    if (user.avatarUrl && user.avatarUrl.trim() !== '')
        score += 12.5;
    if (user.phoneNumber && user.phoneNumber.trim() !== '')
        score += 12.5;
    if (user.dateOfBirth)
        score += 12.5;
    if (user.country && user.country.trim() !== '')
        score += 12.5;
    if (user.timezone && user.timezone.trim() !== '')
        score += 12.5;
    if (user.language && user.language.trim() !== '')
        score += 12.5;
    return Math.round(score);
}
class ProfileService {
    async getProfile(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new errors_1.BadRequestError('User not found.');
        }
        const completion = calculateProfileCompletion(user);
        if (user.profileCompletion !== completion) {
            await user_repository_1.userRepository.update(userId, { profileCompletion: completion });
            user.profileCompletion = completion;
        }
        return user;
    }
    async updateProfile(userId, data) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new errors_1.BadRequestError('User not found.');
        }
        // Prepare update payload (prevent overwriting email, googleId, provider, createdAt)
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.phoneNumber !== undefined)
            updateData.phoneNumber = data.phoneNumber || null;
        if (data.dateOfBirth !== undefined) {
            updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
        }
        if (data.country !== undefined)
            updateData.country = data.country || null;
        if (data.timezone !== undefined)
            updateData.timezone = data.timezone || null;
        if (data.language !== undefined)
            updateData.language = data.language || null;
        // Split name into first and last name if updated
        if (data.name) {
            updateData.firstName = data.name.split(' ')[0] || '';
            updateData.lastName = data.name.split(' ').slice(1).join(' ') || '';
        }
        const updatedUser = await user_repository_1.userRepository.update(userId, updateData);
        // Recalculate completion
        const completion = calculateProfileCompletion(updatedUser);
        const finalUser = await user_repository_1.userRepository.update(userId, { profileCompletion: completion });
        return finalUser;
    }
    async uploadAvatar(userId, filename) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new errors_1.BadRequestError('User not found.');
        }
        const relativeUrl = `/src/uploads/${filename}`;
        const avatarUrl = user.avatarUrl;
        // Delete old custom avatar file if it exists and was custom
        if (avatarUrl && avatarUrl.startsWith('/src/uploads/')) {
            const oldPath = path_1.default.resolve(__dirname, '..', '..', avatarUrl.replace(/^\//, ''));
            try {
                if (fs_1.default.existsSync(oldPath)) {
                    fs_1.default.unlinkSync(oldPath);
                }
            }
            catch (err) {
                console.error('Failed to delete old avatar file:', err);
            }
        }
        const updatedUser = await user_repository_1.userRepository.update(userId, { avatarUrl: relativeUrl });
        const completion = calculateProfileCompletion(updatedUser);
        const finalUser = await user_repository_1.userRepository.update(userId, { profileCompletion: completion });
        return finalUser;
    }
    async deleteAvatar(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new errors_1.BadRequestError('User not found.');
        }
        const avatarUrl = user.avatarUrl;
        // Delete custom avatar file from disk if it was custom
        if (avatarUrl && avatarUrl.startsWith('/src/uploads/')) {
            const filePath = path_1.default.resolve(__dirname, '..', '..', avatarUrl.replace(/^\//, ''));
            try {
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
            catch (err) {
                console.error('Failed to delete avatar file:', err);
            }
        }
        // If they have googleAvatarUrl, revert to it. Otherwise, set to null.
        const newAvatar = user.googleAvatarUrl || null;
        const updatedUser = await user_repository_1.userRepository.update(userId, { avatarUrl: newAvatar });
        const completion = calculateProfileCompletion(updatedUser);
        const finalUser = await user_repository_1.userRepository.update(userId, { profileCompletion: completion });
        return finalUser;
    }
    async revertAvatar(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new errors_1.BadRequestError('User not found.');
        }
        if (!user.googleAvatarUrl) {
            throw new errors_1.BadRequestError('No Google avatar available to revert to.');
        }
        const avatarUrl = user.avatarUrl;
        // Delete custom avatar file from disk if it was custom
        if (avatarUrl && avatarUrl.startsWith('/src/uploads/')) {
            const filePath = path_1.default.resolve(__dirname, '..', '..', avatarUrl.replace(/^\//, ''));
            try {
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
            catch (err) {
                console.error('Failed to delete avatar file:', err);
            }
        }
        const updatedUser = await user_repository_1.userRepository.update(userId, { avatarUrl: user.googleAvatarUrl });
        const completion = calculateProfileCompletion(updatedUser);
        const finalUser = await user_repository_1.userRepository.update(userId, { profileCompletion: completion });
        return finalUser;
    }
    async deleteAccount(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new errors_1.BadRequestError('User not found.');
        }
        const avatarUrl = user.avatarUrl;
        // Clean up local avatar file
        if (avatarUrl && avatarUrl.startsWith('/src/uploads/')) {
            const filePath = path_1.default.resolve(__dirname, '..', '..', avatarUrl.replace(/^\//, ''));
            try {
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
            catch (err) {
                console.error('Failed to delete avatar file:', err);
            }
        }
        // Delete User (Cascade relations in schema.prisma handles portfolios, sessions, etc.)
        await user_repository_1.userRepository.delete(userId);
        return true;
    }
}
exports.ProfileService = ProfileService;
exports.profileService = new ProfileService();
exports.default = exports.profileService;
