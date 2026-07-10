"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpService = exports.OtpService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const otp_repository_1 = require("../repositories/otp.repository");
const mail_service_1 = require("./mail.service");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const client_1 = require("../database/client");
class OtpService {
    COOLDOWN_SECONDS = 60;
    EXPIRY_MINUTES = 5;
    MAX_ATTEMPTS = 5;
    generateNumericCode() {
        // Generate a secure random 6-digit number
        return crypto_1.default.randomInt(100000, 999999).toString();
    }
    async sendVerificationOtp(email, type) {
        // Check if there is an active OTP created within the last 60 seconds (cooldown/rate limit)
        const latestActive = await otp_repository_1.otpRepository.findLatestActive(email, type);
        if (latestActive) {
            const secondsSinceCreation = (Date.now() - latestActive.createdAt.getTime()) / 1000;
            if (secondsSinceCreation < this.COOLDOWN_SECONDS) {
                throw new errors_1.BadRequestError(`Please wait ${Math.ceil(this.COOLDOWN_SECONDS - secondsSinceCreation)} seconds before requesting another code.`);
            }
        }
        // Delete any expired OTPs first
        await client_1.prisma.otp.deleteMany({
            where: {
                email,
                type,
                expiresAt: { lt: new Date() },
            },
        });
        const code = this.generateNumericCode();
        const hashedCode = crypto_1.default.createHash('sha256').update(code).digest('hex');
        const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000);
        const otp = await otp_repository_1.otpRepository.create({
            email,
            code: hashedCode,
            type,
            expiresAt,
        });
        // Send code via email service
        const purposeText = this.getPurposeText(type);
        await mail_service_1.mailService.sendOtp(email, code, purposeText);
        // Print to console for easy local testing
        logger_1.logger.info(`🔑 [SECURITY/DEV] Generated OTP for ${email} (${type}): ${code}`);
        return otp;
    }
    async verifyOtp(email, code, type) {
        const activeOtp = await otp_repository_1.otpRepository.findLatestActive(email, type);
        if (!activeOtp) {
            throw new errors_1.BadRequestError('Verification code has expired or is invalid.');
        }
        if (activeOtp.attempts >= this.MAX_ATTEMPTS) {
            await otp_repository_1.otpRepository.delete(activeOtp.id);
            throw new errors_1.BadRequestError('Maximum verification attempts exceeded. Please request a new code.');
        }
        const hashedInput = crypto_1.default.createHash('sha256').update(code).digest('hex');
        if (activeOtp.code !== hashedInput) {
            await otp_repository_1.otpRepository.incrementAttempts(activeOtp.id);
            throw new errors_1.BadRequestError('Invalid verification code.');
        }
        await otp_repository_1.otpRepository.delete(activeOtp.id);
        return true;
    }
    getPurposeText(type) {
        switch (type) {
            case 'REGISTRATION': return 'New Account Clearance';
            case 'LOGIN': return 'New Device Session Init';
            case 'PASSWORD_RESET': return 'Credentials Reset Vector';
            case 'SENSITIVE_ACTION': return 'Security Restricted Operation';
            default: return 'Identity Verification';
        }
    }
}
exports.OtpService = OtpService;
exports.otpService = new OtpService();
exports.default = exports.otpService;
