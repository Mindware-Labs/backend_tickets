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

        // Asegurar que el formato del remitente sea correcto
        const emailFrom = this.configService.get<string>('EMAIL_FROM');
        if (emailFrom) {
            // Si ya tiene formato correcto, usarlo
            this.fromEmail = emailFrom.includes('<') ? emailFrom : `"Sistema de Tickets" <${emailFrom}>`;
        } else {
            // Si no está configurado, usar el EMAIL_USER como fallback
            this.fromEmail = user ? `"Sistema de Tickets" <${user}>` : '"Sistema de Tickets" <noreply@tickets.com>';
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
            // Configuración adicional para mejorar la entrega
            tls: {
                rejectUnauthorized: false,
            },
            // Timeout aumentado para evitar errores
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
            // Headers para evitar spam y mejorar la entrega
            // Nota: No usar 'Auto-Submitted' ya que hace que Gmail lo trate como notificación
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'high',
                'X-Mailer': 'Sistema de Tickets',
                'MIME-Version': '1.0',
                'X-Auto-Response-Suppress': 'All',
            },
            // Configuración adicional para mejorar la entrega
            priority: 'high' as 'high' | 'normal' | 'low',
            date: new Date(),
            // Reply-To debe ser el mismo que el remitente para evitar problemas
            replyTo: this.fromEmail,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(
                `Email sent successfully to ${options.to}: ${info?.messageId || 'N/A'}`,
            );
            return info;
        } catch (error: any) {
            this.logger.error(`Error sending email to ${options.to}`, error);
            
            // Detectar errores específicos de Gmail
            if (error.responseCode === 550 || error.code === 'EENVELOPE' || 
                (error.message && error.message.includes('550'))) {
                const errorMessage = error.message || '';
                if (errorMessage.includes('does not exist') || errorMessage.includes('NoSuchUser')) {
                    throw new Error(`La dirección de email ${options.to} no existe o no puede recibir correos. Por favor verifica que la dirección sea correcta.`);
                }
            }
            
            throw error;
        }
    }

    async sendPasswordResetEmail(to: string, resetCode: string, userName?: string) {
        const html = passwordResetCodeTemplate(resetCode, userName);

        return this.sendEmail({
            to,
            subject: '🔐 Restablecimiento de Contraseña - Sistema de Tickets',
            html,
            text: `Hola${userName ? ' ' + userName : ''}, has solicitado restablecer tu contraseña. Usa el siguiente codigo: ${resetCode}. Este codigo expira en 10 minutos.`,
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
        verificationCode: string,
        userName: string,
    ) {
        const html = accountVerificationCodeTemplate(verificationCode, userName);

        return this.sendEmail({
            to,
            subject: '🔐 Verifica tu Cuenta - Sistema de Tickets',
            html,
            text: `Hola ${userName}, por favor verifica tu cuenta usando el siguiente codigo: ${verificationCode}. Este codigo expirara en 15 minutos.`,
        });
    }
}
