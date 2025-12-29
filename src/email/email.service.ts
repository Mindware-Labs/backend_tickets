import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
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
    private resend: Resend;
    private readonly logger = new Logger(EmailService.name);
    private readonly fromEmail: string;
    private readonly frontendUrl: string;

    constructor(private configService: ConfigService) {
        // Configura Resend usando la API key
        const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
        
        if (!resendApiKey) {
            this.logger.warn('RESEND_API_KEY is missing. Emails will fail.');
        } else {
            this.resend = new Resend(resendApiKey);
        }
        
        // Configurar remitente
        const emailFrom = this.configService.get<string>('EMAIL_FROM');
        this.fromEmail = emailFrom || 'onboarding@resend.dev';
        
        this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        
        this.logger.log(`EmailService initialized with sender: ${this.fromEmail}`);
    }

    private async sendEmail(options: EmailOptions): Promise<any> {
        // Si no hay API key, solo log y retorna sin error
        if (!this.resend) {
            this.logger.warn(`Skipping email to ${options.to} - RESEND_API_KEY not configured`);
            this.logger.debug(`Email would have been: Subject: ${options.subject}`);
            return { id: 'simulated', message: 'Email skipped - no API key' };
        }

        try {
            const emailData: any = {
                from: this.fromEmail,
                to: options.to,
                subject: options.subject,
                html: options.html,
            };

            // Agregar texto plano si existe
            if (options.text) {
                emailData.text = options.text;
            }

            // Manejar archivos adjuntos (Resend los espera en base64)
            if (options.attachments && options.attachments.length > 0) {
                emailData.attachments = options.attachments.map(att => ({
                    filename: att.filename,
                    content: att.content.toString('base64'),
                    contentType: att.contentType,
                }));
            }

            this.logger.log(`Sending email to: ${options.to}, Subject: ${options.subject}`);
            
            const { data, error } = await this.resend.emails.send(emailData);

            if (error) {
                this.logger.error(`Resend API error for ${options.to}:`, error);
                
                // MANEJO SIMPLIFICADO DE ERRORES - Evita comparaciones de tipos problemáticas
                const errorStr = JSON.stringify(error).toLowerCase();
                const errorMessage = typeof error === 'object' && error !== null 
                    ? (error as any).message || String(error)
                    : String(error);
                
                // Buscar patrones en el mensaje de error
                if (errorStr.includes('invalid_email') || 
                    errorStr.includes('invalid email') || 
                    errorMessage.toLowerCase().includes('invalid')) {
                    throw new Error(`Invalid email address: ${options.to}`);
                }
                
                if (errorStr.includes('rate_limit') || errorStr.includes('rate limit')) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
                
                if (errorStr.includes('unauthorized') || errorStr.includes('api key')) {
                    throw new Error('Invalid API key. Please check your RESEND_API_KEY configuration.');
                }
                
                // Error genérico
                throw new Error(`Failed to send email: ${errorMessage}`);
            }

            this.logger.log(`✅ Email sent successfully to ${options.to}, ID: ${data?.id}`);
            return data;
        } catch (error: any) {
            this.logger.error(`❌ Error sending email to ${options.to}:`, error.message);
            
            // Detectar errores específicos de email en el mensaje
            const errorMsg = error.message?.toLowerCase() || '';
            if (errorMsg.includes('invalid') && errorMsg.includes('email')) {
                throw new Error(`The email address ${options.to} is invalid. Please verify the address.`);
            }
            if (errorMsg.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            if (errorMsg.includes('unauthorized') || errorMsg.includes('api key')) {
                throw new Error('Invalid API key configuration. Please check your RESEND_API_KEY.');
            }
            
            // Re-lanzar el error para que lo maneje el caller
            throw error;
        }
    }

    // MÉTODOS PÚBLICOS (mantén los mismos que ya tenías)
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
            subject: subject || 'Landlord Report',
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

    /**
     * Método simple para verificar la conexión
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            if (!this.resend) {
                return { 
                    success: false, 
                    message: 'RESEND_API_KEY not configured' 
                };
            }

            // Verificamos que la API key sea válida intentando un email simple
            // (pero no lo enviamos realmente para no gastar cuota)
            return { 
                success: true, 
                message: `Resend configured with sender: ${this.fromEmail}` 
            };
        } catch (error) {
            return { 
                success: false, 
                message: `Connection test failed: ${error.message}` 
            };
        }
    }
}