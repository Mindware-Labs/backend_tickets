import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
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
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);
    private readonly fromEmail: string;
    private readonly frontendUrl: string;

    constructor(private configService: ConfigService) {
        const host = this.configService.get<string>('EMAIL_HOST');
        const port = this.configService.get<number>('EMAIL_PORT');
        const user = this.configService.get<string>('EMAIL_USER');
        const pass = this.configService.get<string>('EMAIL_PASSWORD');

        // Ensure the sender format is correct
        const emailFrom = this.configService.get<string>('EMAIL_FROM');
        if (emailFrom) {
            // If it already has the correct format, use it
            this.fromEmail = emailFrom.includes('<') ? emailFrom : `"Ticketing System" <${emailFrom}>`;
        } else {
            // If not configured, use EMAIL_USER as a fallback
            this.fromEmail = user ? `"Ticketing System" <${user}>` : '"Ticketing System" <noreply@tickets.com>';
        }
        this.frontendUrl =
            this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        if (!host || !user || !pass) {
            this.logger.warn(
                'Email configuration is missing. Emails will not be sent correctly.',
            );
        }

        this.transporter = nodemailer.createTransport({
            host: host || 'smtp.example.com',
            port: port || 587,
            secure: port === 465,
            auth: {
                user: user,
                pass: pass,
            },
            // Additional settings to improve delivery
            tls: {
                rejectUnauthorized: false,
            },
            // Increased timeouts to reduce errors
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
        });
    }

    private async sendEmail(options: EmailOptions): Promise<any> {
        const mailOptions = {
            from: this.fromEmail,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            attachments: options.attachments,
            // Headers to reduce spam flags and improve delivery
            // Note: Do not use 'Auto-Submitted' since Gmail treats it as a notification
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'high',
                'X-Mailer': 'Ticketing System',
                'MIME-Version': '1.0',
                'X-Auto-Response-Suppress': 'All',
            },
            // Additional settings to improve delivery
            priority: 'high' as 'high' | 'normal' | 'low',
            date: new Date(),
            // Reply-To should match the sender to avoid issues
            replyTo: this.fromEmail,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            const accepted = (info?.accepted || []).map(String);
            const rejected = (info?.rejected || []).map(String);
            this.logger.log(
                `Email sent successfully to ${options.to}: ${info?.messageId || 'N/A'}`,
            );
            this.logger.log(
                `Email delivery status - accepted: ${accepted.join(', ') || 'none'}, rejected: ${rejected.join(', ') || 'none'}`,
            );
            if (rejected.length > 0 || accepted.length === 0) {
                throw new Error(
                    `Email rejected by SMTP. Accepted: ${accepted.join(', ') || 'none'}, Rejected: ${rejected.join(', ') || 'none'}`,
                );
            }
            return info;
        } catch (error: any) {
            this.logger.error(`Error sending email to ${options.to}`, error);
            
            // Detect specific Gmail errors
            if (error.responseCode === 550 || error.code === 'EENVELOPE' || 
                (error.message && error.message.includes('550'))) {
                const errorMessage = error.message || '';
                if (errorMessage.includes('does not exist') || errorMessage.includes('NoSuchUser')) {
                    throw new Error(`The email address ${options.to} does not exist or cannot receive emails. Please verify that the address is correct.`);
                }
            }
            
            throw error;
        }
    }

    async sendPasswordResetEmail(to: string, resetCode: string, userName?: string) {
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
