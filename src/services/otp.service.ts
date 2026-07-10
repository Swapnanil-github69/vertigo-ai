import crypto from 'crypto';
import { otpRepository } from '../repositories/otp.repository';
import { mailService } from './mail.service';
import { BadRequestError } from '../utils/errors';
import { Otp } from '@prisma/client';
import { logger } from '../utils/logger';
import { prisma } from '../database/client';

export class OtpService {
  private COOLDOWN_SECONDS = 60;
  private EXPIRY_MINUTES = 5;
  private MAX_ATTEMPTS = 5;

  generateNumericCode(): string {
    // Generate a secure random 6-digit number
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendVerificationOtp(email: string, type: string): Promise<Otp> {
    // Check if there is an active OTP created within the last 60 seconds (cooldown/rate limit)
    const latestActive = await otpRepository.findLatestActive(email, type);
    if (latestActive) {
      const secondsSinceCreation = (Date.now() - latestActive.createdAt.getTime()) / 1000;
      if (secondsSinceCreation < this.COOLDOWN_SECONDS) {
        throw new BadRequestError(`Please wait ${Math.ceil(this.COOLDOWN_SECONDS - secondsSinceCreation)} seconds before requesting another code.`);
      }
    }

    // Delete any expired OTPs first
    await prisma.otp.deleteMany({
      where: {
        email,
        type,
        expiresAt: { lt: new Date() },
      },
    });

    const code = this.generateNumericCode();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000);

    const otp = await otpRepository.create({
      email,
      code: hashedCode,
      type,
      expiresAt,
    });

    // Send code via email service
    const purposeText = this.getPurposeText(type);
    await mailService.sendOtp(email, code, purposeText);

    // Print to console for easy local testing
    logger.info(`🔑 [SECURITY/DEV] Generated OTP for ${email} (${type}): ${code}`);

    return otp;
  }

  async verifyOtp(email: string, code: string, type: string): Promise<boolean> {
    const activeOtp = await otpRepository.findLatestActive(email, type);
    if (!activeOtp) {
      throw new BadRequestError('Verification code has expired or is invalid.');
    }

    if (activeOtp.attempts >= this.MAX_ATTEMPTS) {
      await otpRepository.delete(activeOtp.id);
      throw new BadRequestError('Maximum verification attempts exceeded. Please request a new code.');
    }

    const hashedInput = crypto.createHash('sha256').update(code).digest('hex');
    if (activeOtp.code !== hashedInput) {
      await otpRepository.incrementAttempts(activeOtp.id);
      throw new BadRequestError('Invalid verification code.');
    }

    await otpRepository.delete(activeOtp.id);
    return true;
  }

  private getPurposeText(type: string): string {
    switch (type) {
      case 'REGISTRATION': return 'New Account Clearance';
      case 'LOGIN': return 'New Device Session Init';
      case 'PASSWORD_RESET': return 'Credentials Reset Vector';
      case 'SENSITIVE_ACTION': return 'Security Restricted Operation';
      default: return 'Identity Verification';
    }
  }
}

export const otpService = new OtpService();
export default otpService;
