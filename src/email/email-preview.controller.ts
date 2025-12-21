import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  passwordResetTemplate,
  welcomeEmailTemplate,
  ticketCreatedTemplate,
  ticketUpdatedTemplate,
  passwordChangedTemplate,
  accountVerificationTemplate,
} from './templates/email.templates';

@ApiTags('email-preview')
@Controller('email-preview')
export class EmailPreviewController {
  @Get('password-reset')
  @ApiOperation({
    summary: 'Vista previa del email de restablecimiento de contraseña',
  })
  @ApiQuery({ name: 'userName', required: false })
  previewPasswordReset(
    @Query('userName') userName: string,
    @Res() res: Response,
  ) {
    const html = passwordResetTemplate(
      'http://localhost:3000/reset-password?token=ejemplo-token-123',
      userName || 'Usuario Ejemplo',
    );
    res.send(html);
  }

  @Get('welcome')
  @ApiOperation({ summary: 'Vista previa del email de bienvenida' })
  @ApiQuery({ name: 'userName', required: false })
  previewWelcome(@Query('userName') userName: string, @Res() res: Response) {
    const html = welcomeEmailTemplate(
      userName || 'Usuario Ejemplo',
      'http://localhost:3000/login',
    );
    res.send(html);
  }

  @Get('ticket-created')
  @ApiOperation({ summary: 'Vista previa del email de ticket creado' })
  @ApiQuery({ name: 'ticketId', required: false })
  @ApiQuery({ name: 'customerName', required: false })
  previewTicketCreated(
    @Query('ticketId') ticketId: string,
    @Query('customerName') customerName: string,
    @Res() res: Response,
  ) {
    const html = ticketCreatedTemplate(
      ticketId || 'T-12345',
      'Problema con el sistema de autenticación',
      customerName || 'Cliente Ejemplo',
      'http://localhost:3000/tickets/12345',
    );
    res.send(html);
  }

  @Get('ticket-updated')
  @ApiOperation({ summary: 'Vista previa del email de ticket actualizado' })
  @ApiQuery({ name: 'ticketId', required: false })
  @ApiQuery({ name: 'customerName', required: false })
  @ApiQuery({ name: 'status', required: false })
  previewTicketUpdated(
    @Query('ticketId') ticketId: string,
    @Query('customerName') customerName: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const html = ticketUpdatedTemplate(
      ticketId || 'T-12345',
      'Problema con el sistema de autenticación',
      customerName || 'Cliente Ejemplo',
      status || 'en_progreso',
      'Nuestro equipo técnico está investigando el problema. Hemos identificado la causa raíz y estamos trabajando en la solución. Te mantendremos informado de cualquier progreso.',
      'http://localhost:3000/tickets/12345',
    );
    res.send(html);
  }

  @Get('password-changed')
  @ApiOperation({ summary: 'Vista previa del email de contraseña cambiada' })
  @ApiQuery({ name: 'userName', required: false })
  previewPasswordChanged(
    @Query('userName') userName: string,
    @Res() res: Response,
  ) {
    const html = passwordChangedTemplate(userName || 'Usuario Ejemplo');
    res.send(html);
  }

  @Get('verify-account')
  @ApiOperation({ summary: 'Vista previa del email de verificación de cuenta' })
  @ApiQuery({ name: 'userName', required: false })
  previewVerifyAccount(
    @Query('userName') userName: string,
    @Res() res: Response,
  ) {
    const html = accountVerificationTemplate(
      'http://localhost:3000/verify-email?token=ejemplo-token-456',
      userName || 'Usuario Ejemplo',
    );
    res.send(html);
  }

  @Get()
  @ApiOperation({ summary: 'Índice de todas las vistas previas' })
  index(@Res() res: Response) {
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Templates Preview</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          h1 {
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
          }
          .template-list {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .template-item {
            margin: 20px 0;
            padding: 15px;
            border-left: 4px solid #667eea;
            background: #f8f9fa;
            border-radius: 4px;
          }
          .template-item h3 {
            margin: 0 0 10px 0;
            color: #667eea;
          }
          .template-item p {
            margin: 5px 0;
            color: #666;
          }
          a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <h1>📧 Email Templates Preview</h1>
        <div class="template-list">
          <div class="template-item">
            <h3>🔐 Password Reset</h3>
            <p>Email para restablecer contraseña</p>
            <a href="/email-preview/password-reset" target="_blank">Ver Preview →</a>
          </div>
          
          <div class="template-item">
            <h3>🎉 Welcome Email</h3>
            <p>Email de bienvenida para nuevos usuarios</p>
            <a href="/email-preview/welcome" target="_blank">Ver Preview →</a>
          </div>
          
          <div class="template-item">
            <h3>🎫 Ticket Created</h3>
            <p>Email cuando se crea un nuevo ticket</p>
            <a href="/email-preview/ticket-created" target="_blank">Ver Preview →</a>
          </div>
          
          <div class="template-item">
            <h3>🔔 Ticket Updated</h3>
            <p>Email cuando se actualiza un ticket</p>
            <a href="/email-preview/ticket-updated" target="_blank">Ver Preview →</a>
          </div>
          
          <div class="template-item">
            <h3>✓ Password Changed</h3>
            <p>Email de confirmación de cambio de contraseña</p>
            <a href="/email-preview/password-changed" target="_blank">Ver Preview →</a>
          </div>
          
          <div class="template-item">
            <h3>✉️ Account Verification</h3>
            <p>Email para verificar cuenta de nuevo usuario</p>
            <a href="/email-preview/verify-account" target="_blank">Ver Preview →</a>
          </div>
        </div>
        
        <p style="text-align: center; color: #666; margin-top: 30px;">
          Puedes personalizar los parámetros usando query strings (ej: ?userName=Juan&ticketId=T-123)
        </p>
      </body>
      </html>
    `;
    res.send(html);
  }
}
