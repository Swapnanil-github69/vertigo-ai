import { Resend } from 'resend';
import { config } from '../config';
import { logger } from '../utils/logger';

export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(config.RESEND_API_KEY);
  }

  /**
   * Helper to send email with exponential backoff retries
   */
  private async sendEmailWithRetry(
    to: string,
    subject: string,
    html: string,
    retries = 3,
    delay = 1000
  ): Promise<any> {
    let attempt = 0;
    while (attempt < retries) {
      attempt++;
      try {
        const response = await this.resend.emails.send({
          from: config.EMAIL_FROM,
          to: [to],
          subject,
          html,
        });

        if (response.error) {
          logger.warn(`[Resend] Delivery attempt ${attempt}/${retries} failed: ${response.error.message}`, {
            errorName: response.error.name,
            requestId: (response as any).requestId,
          });

          if (attempt >= retries) {
            throw response.error;
          }
          // Wait with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
          logger.info(`[Resend] Retrying email delivery (Attempt ${attempt + 1}/${retries})...`);
        } else {
          // Success
          logger.info(`📧 [Resend] Email successfully dispatched to [${to}]`, {
            emailId: response.data?.id,
            subject,
          });
          return response.data;
        }
      } catch (err: any) {
        logger.error(`[Resend] Delivery attempt ${attempt}/${retries} encountered error: ${err.message}`);
        if (attempt >= retries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
        logger.info(`[Resend] Retrying email delivery (Attempt ${attempt + 1}/${retries})...`);
      }
    }
  }

  /**
   * Send standard OTP email
   */
  async sendOtp(to: string, code: string, purpose: string): Promise<boolean> {
    const subject = `[Vertigo] Authorization Key: ${code}`;
    const html = this.getOtpTemplate(code, purpose);

    try {
      await this.sendEmailWithRetry(to, subject, html);
      return true;
    } catch (error: any) {
      logger.warn(`⚠️ [EmailService] sendOtp to ${to} failed: ${error.message}. Continuing with local console fallback.`);
      return true;
    }
  }

  /**
   * Send Password Reset OTP email
   */
  async sendPasswordReset(to: string, code: string): Promise<boolean> {
    const subject = `[Vertigo] Password Reset Key: ${code}`;
    const html = this.getPasswordResetTemplate(code);

    try {
      await this.sendEmailWithRetry(to, subject, html);
      return true;
    } catch (error: any) {
      logger.warn(`⚠️ [EmailService] sendPasswordReset to ${to} failed: ${error.message}. Continuing with local console fallback.`);
      return true;
    }
  }

  /**
   * Send optional Welcome email
   */
  async sendWelcome(to: string, name: string): Promise<boolean> {
    const subject = `Welcome to Vertigo - System Clearance Approved`;
    const html = this.getWelcomeTemplate(name);

    try {
      await this.sendEmailWithRetry(to, subject, html);
      return true;
    } catch (error: any) {
      logger.error(`[EmailService] Failed to send Welcome email to [${to}]:`, error);
      return false; // Silent return for welcome email to avoid breaking flow
    }
  }

  /*
  private handleResendError(error: any): AppError {
    const msg = error.message || 'An unexpected error occurred during email delivery.';
    const errorName = error.name || '';

    logger.error(`[Resend] Internal API failure details: Name=${errorName}, Message=${msg}`, { error });

    if (errorName === 'rate_limit_exceeded' || msg.toLowerCase().includes('rate limit')) {
      return new AppError('Email delivery service is temporarily rate limited. Please try again in a few moments.', 429);
    }
    if (errorName === 'invalid_api_key' || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('unauthorized')) {
      return new AppError('Email delivery is misconfigured on the server (invalid API key). Please contact system admin.', 500);
    }
    if (errorName === 'validation_error' || msg.toLowerCase().includes('from') || msg.toLowerCase().includes('domain') || msg.toLowerCase().includes('verify')) {
      return new AppError('Email delivery is misconfigured on the server (invalid sender domain). Please contact system admin.', 500);
    }

    return new AppError('Failed to send authentication email. Please verify your email and try again.', 400);
  }
  */

  /**
   * Standardized dark-themed email wrapper layout
   */
  private getEmailWrapper(contentHtml: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vertigo Intelligence</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Courier+New&display=swap');
          body {
            background-color: #080809;
            margin: 0;
            padding: 0;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          .email-container {
            max-width: 500px;
            margin: 40px auto;
            background-color: #12131a;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .logo-header {
            text-align: center;
            margin-bottom: 32px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 24px;
          }
          .logo-text {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: 3px;
            color: #ffffff;
          }
          .logo-dot {
            color: #3b82f6;
          }
          .logo-subtitle {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 4px;
            color: #94a3b8;
            margin-top: 6px;
          }
          .footer-section {
            text-align: center;
            margin-top: 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 24px;
            font-size: 11px;
            color: #64748b;
            line-height: 1.5;
          }
          .security-tag {
            display: inline-block;
            background-color: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 600;
            margin-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="logo-header">
            <div class="logo-text">VERTIGO<span class="logo-dot">.AI</span></div>
            <div class="logo-subtitle">Financial Intelligence Platform</div>
          </div>
          
          ${contentHtml}
          
          <div class="footer-section">
            This is an automated transmission from Vertigo Core security servers.<br>
            If you didn't request this email, you can safely ignore it.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getOtpTemplate(code: string, purpose: string): string {
    const content = `
      <div style="color: #f1f5f9; font-size: 14px; line-height: 1.6; text-align: center;">
        <h3 style="color: #ffffff; font-size: 18px; margin-top: 0; font-weight: 600;">Identity Authorization Request</h3>
        <p style="color: #94a3b8;">A security clearance check was triggered for:</p>
        <p style="font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-top: -8px;">${purpose}</p>
        
        <p style="margin-top: 24px; color: #94a3b8;">Your verification code is:</p>
        
        <div style="background-color: #0b0c10; border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', Courier, monospace;">${code}</span>
        </div>
        
        <p style="font-size: 12px; color: #f59e0b; margin-top: 16px; font-weight: 600;">
          ⏳ Valid for 5 minutes
        </p>
        
        <div>
          <span class="security-tag">🛡️ Never share this code with anyone.</span>
        </div>
      </div>
    `;
    return this.getEmailWrapper(content);
  }

  private getPasswordResetTemplate(code: string): string {
    const content = `
      <div style="color: #f1f5f9; font-size: 14px; line-height: 1.6; text-align: center;">
        <h3 style="color: #ffffff; font-size: 18px; margin-top: 0; font-weight: 600;">Credentials Reset Authorization</h3>
        <p style="color: #94a3b8;">A password reset request was initialized for your account.</p>
        <p style="color: #94a3b8;">Please execute the reset using the authorization key below:</p>
        
        <div style="background-color: #0b0c10; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', Courier, monospace;">${code}</span>
        </div>
        
        <p style="font-size: 12px; color: #f59e0b; margin-top: 16px; font-weight: 600;">
          ⏳ Valid for 5 minutes
        </p>
        
        <div>
          <span class="security-tag">🛡️ Never share this code with anyone.</span>
        </div>
      </div>
    `;
    return this.getEmailWrapper(content);
  }

  private getWelcomeTemplate(name: string): string {
    const content = `
      <div style="color: #f1f5f9; font-size: 14px; line-height: 1.6; text-align: left;">
        <h3 style="color: #ffffff; font-size: 18px; margin-top: 0; font-weight: 600; text-align: center;">Clearance Approved</h3>
        <p>Hello ${name},</p>
        <p>Your user profile has been successfully integrated into the Vertigo core database. Your credentials are now authorized, and your secure workspace dashboard is fully online.</p>
        <p>You can now monitor stabilizing risk vectors, configure advanced watchlists, and interface with our AI assistant systems.</p>
        
        <div style="text-align: center; margin-top: 28px;">
          <a href="http://localhost:3000" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; transition: background-color 0.2s;">
            Access Dashboard
          </a>
        </div>
      </div>
    `;
    return this.getEmailWrapper(content);
  }
}

export const emailService = new EmailService();
export default emailService;
