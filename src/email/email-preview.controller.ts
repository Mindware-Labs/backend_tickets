import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  passwordResetCodeTemplate,
  welcomeEmailTemplate,
  ticketCreatedTemplate,
  ticketUpdatedTemplate,
  passwordChangedTemplate,
  accountVerificationCodeTemplate,
} from './templates/email.templates';

@ApiTags('email-preview')
@Controller('email-preview')
export class EmailPreviewController {
  @Get('password-reset')
  @ApiOperation({
    summary: 'Preview of the password reset email',
  })
  @ApiQuery({ name: 'userName', required: false })
  previewPasswordReset(
    @Query('userName') userName: string,
    @Res() res: Response,
  ) {
    const html = passwordResetCodeTemplate('123456', userName || 'Example User');
    res.send(html);
  }

  @Get('welcome')
  @ApiOperation({ summary: 'Preview of the welcome email' })
  @ApiQuery({ name: 'userName', required: false })
  previewWelcome(@Query('userName') userName: string, @Res() res: Response) {
    const html = welcomeEmailTemplate(
      userName || 'Example User',
      'http://localhost:3000/login',
    );
    res.send(html);
  }

  @Get('ticket-created')
  @ApiOperation({ summary: 'Preview of the ticket created email' })
  @ApiQuery({ name: 'ticketId', required: false })
  @ApiQuery({ name: 'customerName', required: false })
  previewTicketCreated(
    @Query('ticketId') ticketId: string,
    @Query('customerName') customerName: string,
    @Res() res: Response,
  ) {
    const html = ticketCreatedTemplate(
      ticketId || 'T-12345',
      'Issue with the authentication system',
      customerName || 'Example Customer',
      'http://localhost:3000/tickets/12345',
    );
    res.send(html);
  }

  @Get('ticket-updated')
  @ApiOperation({ summary: 'Preview of the ticket updated email' })
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
      'Issue with the authentication system',
      customerName || 'Example Customer',
      status || 'IN_PROGRESS',
      'Our technical team is investigating the issue. We have identified the root cause and are working on a fix. We will keep you updated on any progress.',
      'http://localhost:3000/tickets/12345',
    );
    res.send(html);
  }

  @Get('password-changed')
  @ApiOperation({ summary: 'Preview of the password changed email' })
  @ApiQuery({ name: 'userName', required: false })
  previewPasswordChanged(
    @Query('userName') userName: string,
    @Res() res: Response,
  ) {
    const html = passwordChangedTemplate(userName || 'Example User');
    res.send(html);
  }

  @Get('verify-account')
  @ApiOperation({ summary: 'Preview of the account verification email' })
  @ApiQuery({ name: 'userName', required: false })
  previewVerifyAccount(
    @Query('userName') userName: string,
    @Res() res: Response,
  ) {
    const html = accountVerificationCodeTemplate(
      '654321',
      userName || 'Example User',
    );
    res.send(html);
  }

  @Get()
  @ApiOperation({ summary: 'Index of all previews' })
  index(@Res() res: Response) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
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
            <h3>🔐 Password Reset Code</h3>
            <p>Email with a code to reset the password</p>
            <a href="/email-preview/password-reset" target="_blank">View Preview -></a>
          </div>
          
          <div class="template-item">
            <h3>🎉 Welcome Email</h3>
            <p>Welcome email for new users</p>
            <a href="/email-preview/welcome" target="_blank">View Preview -></a>
          </div>
          
          <div class="template-item">
            <h3>🎫 Ticket Created</h3>
            <p>Email sent when a new ticket is created</p>
            <a href="/email-preview/ticket-created" target="_blank">View Preview -></a>
          </div>
          
          <div class="template-item">
            <h3>🔔 Ticket Updated</h3>
            <p>Email sent when a ticket is updated</p>
            <a href="/email-preview/ticket-updated" target="_blank">View Preview -></a>
          </div>
          
          <div class="template-item">
            <h3>✓ Password Changed</h3>
            <p>Password change confirmation email</p>
            <a href="/email-preview/password-changed" target="_blank">View Preview -></a>
          </div>
          
          <div class="template-item">
            <h3>✉️ Account Verification Code</h3>
            <p>Email with a code to verify a new user account</p>
            <a href="/email-preview/verify-account" target="_blank">View Preview -></a>
          </div>
        </div>
        
        <p style="text-align: center; color: #666; margin-top: 30px;">
          You can customize parameters using query strings (example: ?userName=John&ticketId=T-123)
        </p>
      </body>
      </html>
    `;
    res.send(html);
  }
}
