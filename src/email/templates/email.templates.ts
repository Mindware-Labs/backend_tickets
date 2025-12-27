import { baseEmailTemplate } from './base.template';

export const passwordResetTemplate = (resetLink: string, userName?: string) => {
  const content = `
    <h2>Password Reset Request</h2>
    
    ${userName ? `<p>Hi <strong>${userName}</strong>,</p>` : '<p>Hi,</p>'}
    
    <p>We received a request to reset the password for your account. If you did not request this change, you can safely ignore this email.</p>
    
    <div class="info-box">
      <p><strong>⏰ This link will expire in 1 hour</strong></p>
      <p>For security reasons, this link can only be used once.</p>
    </div>
    
    <p>To reset your password, click the button below:</p>
    
    <div style="text-align: center;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    
    <p style="font-size: 14px; color: #6c757d; margin-top: 20px;">
      If the button does not work, copy and paste the following link into your browser:
    </p>
    <p style="font-size: 14px; word-break: break-all; color: #667eea;">
      ${resetLink}
    </p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      <strong>Security tips:</strong><br>
      • Never share your password with anyone<br>
      • Use a unique, strong password<br>
      • Do not reuse passwords from other accounts
    </p>
  `;

  return baseEmailTemplate(content, 'Reset Password');
};

export const passwordResetCodeTemplate = (resetCode: string, userName?: string) => {
  const content = `
    <h2>Password Reset Code</h2>
    
    ${userName ? `<p>Hi <strong>${userName}</strong>,</p>` : '<p>Hi,</p>'}
    
    <p>We received a request to reset your account password. Use the following code to continue. If you did not request this change, you can ignore this email.</p>
    
    <div class="info-box" style="text-align: center;">
      <p style="font-size: 20px; font-weight: bold; letter-spacing: 4px; margin: 0;">
        ${resetCode}
      </p>
      <p style="margin-top: 10px;"><strong>⏰ This code expires in 10 minutes</strong></p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      <strong>Security tips:</strong><br>
      • Do not share this code with anyone<br>
      • Use a unique, strong password<br>
      • If you did not request the change, ignore this email
    </p>
  `;

  return baseEmailTemplate(content, 'Reset Password');
};

export const welcomeEmailTemplate = (userName: string, loginLink?: string) => {
  const content = `
    <h2>Welcome to Ticketing System! 🎉</h2>
    
    <p>Hi <strong>${userName}</strong>,</p>
    
    <p>Thanks for signing up! We are excited to have you with us. Your account has been created successfully and you can start using our ticket management system.</p>
    
    <div class="info-box">
      <p><strong>✓ Your account is active</strong></p>
      <p>You now have access to all system features.</p>
    </div>
    
    <p><strong>What can you do now?</strong></p>
    <ul style="margin: 15px 0; padding-left: 20px; color: #495057;">
      <li>Create and manage tickets</li>
      <li>Collaborate with your team</li>
      <li>Track your requests</li>
      <li>Access the knowledge base</li>
    </ul>
    
    ${
      loginLink
        ? `
      <div style="text-align: center;">
        <a href="${loginLink}" class="button">Access the System</a>
      </div>
    `
        : ''
    }
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      If you need help or have any questions, please contact us. We are here to help!
    </p>
  `;

  return baseEmailTemplate(content, 'Welcome to Ticketing System');
};

export const ticketCreatedTemplate = (
  ticketId: string,
  ticketTitle: string,
  customerName: string,
  ticketLink?: string,
) => {
  const content = `
    <h2>New Ticket Created 🎫</h2>
    
    <p>Hi <strong>${customerName}</strong>,</p>
    
    <p>Your ticket has been created successfully. Our team will review it as soon as possible.</p>
    
    <div class="info-box">
      <p><strong>Ticket ID:</strong> #${ticketId}</p>
      <p><strong>Subject:</strong> ${ticketTitle}</p>
      <p><strong>Status:</strong> Open</p>
    </div>
    
    <p>You will receive automatic updates when there are changes to your ticket.</p>
    
    ${
      ticketLink
        ? `
      <div style="text-align: center;">
        <a href="${ticketLink}" class="button">View Ticket</a>
      </div>
    `
        : ''
    }
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      <strong>Estimated response time:</strong> 24-48 hours<br>
      You can track your ticket at any time.
    </p>
  `;

  return baseEmailTemplate(content, 'Ticket Created');
};

export const ticketUpdatedTemplate = (
  ticketId: string,
  ticketTitle: string,
  customerName: string,
  status: string,
  updateMessage: string,
  ticketLink?: string,
) => {
  const statusColors: Record<string, string> = {
    open: '#28a745',
    in_progress: '#ffc107',
    resolved: '#17a2b8',
    closed: '#6c757d',
  };

  const statusColor = statusColors[status.toLowerCase()] || '#667eea';

  const content = `
    <h2>Ticket Update 🔔</h2>
    
    <p>Hi <strong>${customerName}</strong>,</p>
    
    <p>Your ticket has been updated. Here are the details:</p>
    
    <div class="info-box">
      <p><strong>Ticket ID:</strong> #${ticketId}</p>
      <p><strong>Subject:</strong> ${ticketTitle}</p>
      <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status.toUpperCase()}</span></p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #212529;"><strong>Update:</strong></p>
      <p style="margin: 10px 0 0 0; color: #495057;">${updateMessage}</p>
    </div>
    
    ${
      ticketLink
        ? `
      <div style="text-align: center;">
        <a href="${ticketLink}" class="button">View Ticket Details</a>
      </div>
    `
        : ''
    }
    
    <p style="font-size: 14px; color: #6c757d; margin-top: 20px;">
      Thank you for your patience. We are continuing to work to resolve your request.
    </p>
  `;

  return baseEmailTemplate(content, 'Ticket Update');
};

export const passwordChangedTemplate = (userName: string) => {
  const content = `
    <h2>Password Changed Successfully ✓</h2>
    
    <p>Hi <strong>${userName}</strong>,</p>
    
    <p>We confirm that your account password has been changed successfully.</p>
    
    <div class="info-box">
      <p><strong>Date and time:</strong> ${new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      })}</p>
    </div>
    
    <p><strong>If you did not make this change:</strong></p>
    <p style="color: #dc3545;">Please contact our support team immediately. Your account may be compromised.</p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      This is a security notification email to keep your account protected.
    </p>
  `;

  return baseEmailTemplate(content, 'Password Changed');
};

export const accountVerificationTemplate = (
  verificationLink: string,
  userName: string,
) => {
  const content = `
    <h2>Account Verification</h2>
    
    <p>Hi <strong>${userName}</strong>,</p>
    
    <p>Thanks for registering in our Ticketing System. To complete your registration and activate your account, please verify your email by clicking the button below.</p>
    
    <div class="info-box">
      <p><strong>⏰ This link will expire in 24 hours</strong></p>
      <p>For security reasons, this link can only be used once.</p>
    </div>
    
    <p>To verify your account, click the button below:</p>
    
    <div style="text-align: center;">
      <a href="${verificationLink}" class="button">Verify Email</a>
    </div>
    
    <p style="font-size: 14px; color: #6c757d; margin-top: 20px;">
      If the button does not work, copy and paste the following link into your browser:
    </p>
    <p style="font-size: 14px; word-break: break-all; color: #667eea;">
      ${verificationLink}
    </p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      <strong>Security tips:</strong><br>
      • Do not share this link with anyone<br>
      • If you did not create an account, you can safely ignore this email<br>
      • Once verified, you can sign in to the system
    </p>
  `;

  return baseEmailTemplate(content, 'Account Verification');
};

export const accountVerificationCodeTemplate = (
  verificationCode: string,
  userName: string,
) => {
  const content = `
    <h2>Account Verification</h2>
    
    <p>Hi <strong>${userName}</strong>,</p>
    
    <p>Thanks for registering in our Ticketing System. To complete your registration, enter the following code on the verification screen.</p>
    
    <div class="info-box" style="text-align: center;">
      <p style="font-size: 20px; font-weight: bold; letter-spacing: 4px; margin: 0;">
        ${verificationCode}
      </p>
      <p style="margin-top: 10px;"><strong>⏰ This code expires in 15 minutes</strong></p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      <strong>Security tips:</strong><br>
      • Do not share this code with anyone<br>
      • If you did not create an account, you can ignore this email<br>
      • Once verified, you can sign in to the system
    </p>
  `;

  return baseEmailTemplate(content, 'Account Verification');
};
