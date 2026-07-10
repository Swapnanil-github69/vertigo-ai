"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailService = exports.MailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class MailService {
    transporter;
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: config_1.config.SMTP_HOST,
            port: config_1.config.SMTP_PORT,
            auth: {
                user: config_1.config.SMTP_USER,
                pass: config_1.config.SMTP_PASS,
            },
        });
    }
    async sendMail(to, subject, html) {
        try {
            await this.transporter.sendMail({
                from: config_1.config.SMTP_FROM,
                to,
                subject,
                html,
            });
            logger_1.logger.info(`📧 Email dispatched to [${to}] with subject: "${subject}"`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`❌ Failed to send email to [${to}]:`, error);
            return false;
        }
    }
    async sendOtp(to, code, purpose) {
        const subject = `[Vertigo] Identity Authorization Key: ${code}`;
        const html = `
      <div style="background-color: #080809; color: #f1f5f9; font-family: sans-serif; padding: 24px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); max-width: 500px; margin: auto;">
        <h2 style="color: #1415A8; margin-top: 0; font-family: 'Raleway', sans-serif;">Vertigo Terminal</h2>
        <p style="font-size: 14px; color: #94A3B8;">An identity verification check was triggered for: <strong>${purpose}</strong>.</p>
        <p style="font-size: 14px; color: #94A3B8;">Please execute the verification using the authorization key below:</p>
        <div style="background-color: #111216; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff; font-family: monospace;">${code}</span>
        </div>
        <p style="font-size: 11px; color: #94A3B8; opacity: 0.6; margin-bottom: 0;">This key is single-use only and expires in 5 minutes. If you did not request this, secure your account credentials immediately.</p>
      </div>
    `;
        return this.sendMail(to, subject, html);
    }
}
exports.MailService = MailService;
exports.mailService = new MailService();
exports.default = exports.mailService;
