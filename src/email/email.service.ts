import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
    passwordResetTemplate,
    welcomeEmailTemplate,
    ticketCreatedTemplate,
    ticketUpdatedTemplate,
    passwordChangedTemplate,
    accountVerificationTemplate,
} from './templates/email.templates';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
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

        this.fromEmail =
            this.configService.get<string>('EMAIL_FROM') ||
            '"Sistema de Tickets" <noreply@tickets.com>';
        this.frontendUrl =
            this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';

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
        });
    }

    private async sendEmail(options: EmailOptions): Promise<any> {
        const mailOptions = {
            from: this.fromEmail,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(
                `Email sent successfully to ${options.to}: ${info.messageId}`,
            );
            return info;
        } catch (error) {
            this.logger.error(`Error sending email to ${options.to}`, error);
            throw error;
        }
    }

    async sendPasswordResetEmail(to: string, token: string, userName?: string) {
        const resetLink = `${this.frontendUrl}/reset-password?token=${token}`;
        const html = passwordResetTemplate(resetLink, userName);

        return this.sendEmail({
            to,
            subject: '🔐 Restablecimiento de Contraseña - Sistema de Tickets',
            html,
            text: `Hola${userName ? ' ' + userName : ''}, has solicitado restablecer tu contraseña. Usa el siguiente enlace: ${resetLink}. Este enlace expirará en 1 hora.`,
        });
    }

    async sendWelcomeEmail(to: string, userName: string) {
        const loginLink = `${this.frontendUrl}/login`;
        const html = welcomeEmailTemplate(userName, loginLink);

        return this.sendEmail({
            to,
            subject: '🎉 ¡Bienvenido a Sistema de Tickets!',
            html,
            text: `¡Bienvenido ${userName}! Tu cuenta ha sido creada exitosamente. Accede al sistema en: ${loginLink}`,
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
            subject: `🎫 Ticket #${ticketId} Creado - ${ticketTitle}`,
            html,
            text: `Hola ${customerName}, tu ticket #${ticketId} ha sido creado. Título: ${ticketTitle}. Ver en: ${ticketLink}`,
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
            subject: `🔔 Actualización del Ticket #${ticketId}`,
            html,
            text: `Hola ${customerName}, tu ticket #${ticketId} ha sido actualizado. Estado: ${status}. Mensaje: ${updateMessage}. Ver en: ${ticketLink}`,
        });
    }

    async sendPasswordChangedEmail(to: string, userName: string) {
        const html = passwordChangedTemplate(userName);

        return this.sendEmail({
            to,
            subject: '✓ Contraseña Cambiada Exitosamente',
            html,
            text: `Hola ${userName}, tu contraseña ha sido cambiada exitosamente. Si no realizaste este cambio, contacta inmediatamente a soporte.`,
        });
    }

    async sendAccountVerificationEmail(
        to: string,
        token: string,
        userName: string,
    ) {
        const verificationLink = `${this.frontendUrl}/verify-email?token=${token}`;
        const html = accountVerificationTemplate(verificationLink, userName);

        return this.sendEmail({
            to,
            subject: '✉️ Verifica tu Cuenta - Sistema de Tickets',
            html,
            text: `Hola ${userName}, por favor verifica tu cuenta usando el siguiente enlace: ${verificationLink}. Este enlace expirará en 24 horas.`,
        });
    }
}
