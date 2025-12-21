import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor(private configService: ConfigService) {
        const host = this.configService.get<string>('EMAIL_HOST');
        const port = this.configService.get<number>('EMAIL_PORT');
        const user = this.configService.get<string>('EMAIL_USER');
        const pass = this.configService.get<string>('EMAIL_PASSWORD');

        if (!host || !user || !pass) {
            this.logger.warn('Email configuration is missing. Emails will not be sent correctly.');
        }

        this.transporter = nodemailer.createTransport({
            host: host || 'smtp.example.com', // Fallback to avoid crash on startup, but will fail on send
            port: port || 587,
            secure: port === 465, // true for 465, false for other ports
            auth: {
                user: user,
                pass: pass,
            },
        });
    }

    async sendPasswordResetEmail(to: string, token: string) {
        const resetLink = `http://localhost:3000/reset-password?token=${token}`; // Adjust implementation to use env var for frontend URL if needed
        // For now, assume a standard link structure, perhaps could be improved later with a FRONTEND_URL env var.

        const mailOptions = {
            from: this.configService.get<string>('EMAIL_FROM') || '"No Reply" <noreply@example.com>', // Sender address
            to: to, // List of receivers
            subject: 'Password Reset Request', // Subject line
            text: `You requested a password reset. Please click the following link to reset your password: ${resetLink}`, // Plain text body
            html: `<p>You requested a password reset. Please click the following link to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p>`, // HTML body
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Message sent: ${info.messageId}`);
            return info;
        } catch (error) {
            this.logger.error('Error sending email', error);
            throw error;
        }
    }
}
