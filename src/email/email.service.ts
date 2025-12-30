import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  passwordResetCodeTemplate,
  welcomeEmailTemplate,
  ticketCreatedTemplate,
  ticketUpdatedTemplate,
  passwordChangedTemplate,
  accountVerificationCodeTemplate,
  accountVerificationTemplate,
} from './templates/email.templates';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly frontendUrl: string;
  private readonly brevoApiKey?: string;

  constructor(private configService: ConfigService) {
    const user = this.configService.get<string>('EMAIL_USER');
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY');

    // Ensure the sender format is correct
    const emailFrom = this.configService.get<string>('EMAIL_FROM');
    if (emailFrom) {
      // If it already has the correct format, use it
      if (emailFrom.includes('<')) {
        this.senderName =
          emailFrom.match(/"?(.+?)"?\s*</)?.[1]?.trim() || 'Ticketing System';
        this.senderEmail =
          emailFrom.match(/<(.+?)>/)?.[1]?.trim() || user || 'noreply@tickets.com';
      } else {
        this.senderName = 'Ticketing System';
        this.senderEmail = emailFrom;
      }
    } else {
      // If not configured, use EMAIL_USER as a fallback
      this.senderName = 'Ticketing System';
      this.senderEmail = user || 'noreply@tickets.com';
    }
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    if (!this.brevoApiKey) {
      this.logger.warn(
        'BREVO_API_KEY is missing. Emails will not be sent correctly.',
      );
    }
  }

  private async sendEmail(options: EmailOptions): Promise<any> {
    if (!this.brevoApiKey) {
      throw new Error('Email service is not configured: missing BREVO_API_KEY');
    }

    const payload: Record<string, any> = {
      sender: { email: this.senderEmail, name: this.senderName },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
      replyTo: { email: this.senderEmail, name: this.senderName },
    };

    if (options.attachments?.length) {
      payload.attachment = options.attachments.map((attachment) => ({
        name: attachment.filename,
        content: attachment.content.toString('base64'),
        type: attachment.contentType || 'application/octet-stream',
      }));
    }

    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        payload,
        {
          headers: {
            'api-key': this.brevoApiKey,
            accept: 'application/json',
            'content-type': 'application/json',
          },
          timeout: 10000,
        },
      );
      this.logger.log(`Email sent successfully via Brevo to ${options.to}`);
      return response.data;
    } catch (error: any) {
      const details =
        error?.response?.data || error?.message || 'Unknown error from Brevo';
      this.logger.error(
        `Error sending email via Brevo to ${options.to}`,
        details,
      );

      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw error;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetCode: string,
    userName?: string,
  ) {
    const html = passwordResetCodeTemplate(resetCode, userName);

    return this.sendEmail({
      to,
      subject: '🔐 Password Reset - Ticketing System',
      html,
      text: `Hi${userName ? ' ' + userName : ''}, you requested a password reset. Use the following code: ${resetCode}. This code expires in 10 minutes.`,
    });
  }

  async sendWelcomeEmail(to: string, userName: string) {
    const loginLink = `${this.frontendUrl}/login`;
    const html = welcomeEmailTemplate(userName, loginLink);

    return this.sendEmail({
      to,
      subject: '🎉 Welcome to Ticketing System!',
      html,
      text: `Welcome ${userName}! Your account has been created successfully. Access the system at: ${loginLink}`,
    });
  }

  async sendTicketCreatedEmail(
    to: string,
    ticketId: string,
    ticketTitle: string,
    customerName: string,
  ) {
    const ticketLink = `${this.frontendUrl}/tickets/${ticketId}`;
    const html = ticketCreatedTemplate(
      ticketId,
      ticketTitle,
      customerName,
      ticketLink,
    );

    return this.sendEmail({
      to,
      subject: `🎫 Ticket #${ticketId} Created - ${ticketTitle}`,
      html,
      text: `Hi ${customerName}, your ticket #${ticketId} has been created. Title: ${ticketTitle}. View at: ${ticketLink}`,
    });
  }

  async sendTicketUpdatedEmail(
    to: string,
    ticketId: string,
    ticketTitle: string,
    customerName: string,
    status: string,
    updateMessage: string,
  ) {
    const ticketLink = `${this.frontendUrl}/tickets/${ticketId}`;
    const html = ticketUpdatedTemplate(
      ticketId,
      ticketTitle,
      customerName,
      status,
      updateMessage,
      ticketLink,
    );

    return this.sendEmail({
      to,
      subject: `🔔 Ticket Update #${ticketId}`,
      html,
      text: `Hi ${customerName}, your ticket #${ticketId} has been updated. Status: ${status}. Message: ${updateMessage}. View at: ${ticketLink}`,
    });
  }

  async sendPasswordChangedEmail(to: string, userName: string) {
    const html = passwordChangedTemplate(userName);

    return this.sendEmail({
      to,
      subject: '✓ Password Changed Successfully',
      html,
      text: `Hi ${userName}, your password has been changed successfully. If you did not make this change, contact support immediately.`,
    });
  }

  async sendAccountVerificationEmail(
    to: string,
    verificationCode: string,
    userName: string,
  ) {
    const html = accountVerificationCodeTemplate(verificationCode, userName);

    return this.sendEmail({
      to,
      subject: '🔐 Verify Your Account - Ticketing System',
      html,
      text: `Hi ${userName}, please verify your account using the following code: ${verificationCode}. This code expires in 15 minutes.`,
    });
  }

  async sendAccountVerificationLink(
    to: string,
    verificationLink: string,
    userName: string,
  ) {
    const html = accountVerificationTemplate(verificationLink, userName);

    return this.sendEmail({
      to,
      subject: '🔐 Verify Your Account - Ticketing System',
      html,
      text: `Hi ${userName}, please verify your account using this link: ${verificationLink}. This link expires in 24 hours.`,
    });
  }

  async sendLandlordReportEmail(
    to: string,
    subject: string,
    html: string,
    pdf: Buffer,
  ) {
    return this.sendEmail({
      to,
      subject,
      html,
      attachments: [
        {
          filename: 'landlord-report.pdf',
          content: pdf,
          contentType: 'application/pdf',
        },
      ],
    });
  }
}
