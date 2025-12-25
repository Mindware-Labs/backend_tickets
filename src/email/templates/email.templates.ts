import { baseEmailTemplate } from './base.template';

export const passwordResetTemplate = (resetLink: string, userName?: string) => {
  const content = `
    <h2>Solicitud de Restablecimiento de Contraseña</h2>
    
    ${userName ? `<p>Hola <strong>${userName}</strong>,</p>` : '<p>Hola,</p>'}
    
    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
    
    <div class="info-box">
      <p><strong>⏰ Este enlace expirará en 1 hora</strong></p>
      <p>Por razones de seguridad, este enlace solo puede ser usado una vez.</p>
    </div>
    
    <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>
    
    <div style="text-align: center;">
      <a href="${resetLink}" class="button">Restablecer Contraseña</a>
    </div>
    
    <p style="font-size: 14px; color: #6c757d; margin-top: 20px;">
      Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
    </p>
    <p style="font-size: 14px; word-break: break-all; color: #667eea;">
      ${resetLink}
    </p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      <strong>Consejos de seguridad:</strong><br>
      • Nunca compartas tu contraseña con nadie<br>
      • Usa una contraseña única y segura<br>
      • No reutilices contraseñas de otras cuentas
    </p>
  `;

  return baseEmailTemplate(content, 'Restablecer Contraseña');
};

export const passwordResetCodeTemplate = (resetCode: string, userName?: string) => {
  const content = `
    <h2>Codigo de Restablecimiento de Contraseña</h2>
    
    ${userName ? `<p>Hola <strong>${userName}</strong>,</p>` : '<p>Hola,</p>'}
    
    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente codigo para continuar. Si no solicitaste este cambio, puedes ignorar este correo.</p>
    
    <div class="info-box" style="text-align: center;">
      <p style="font-size: 20px; font-weight: bold; letter-spacing: 4px; margin: 0;">
        ${resetCode}
      </p>
      <p style="margin-top: 10px;"><strong>⏰ Este codigo expirara en 10 minutos</strong></p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      <strong>Consejos de seguridad:</strong><br>
      • No compartas este codigo con nadie<br>
      • Usa una contraseña unica y segura<br>
      • Si no solicitaste el cambio, ignora este correo
    </p>
  `;

  return baseEmailTemplate(content, 'Restablecer Contraseña');
};

export const welcomeEmailTemplate = (userName: string, loginLink?: string) => {
  const content = `
    <h2>¡Bienvenido a Sistema de Tickets! 🎉</h2>
    
    <p>Hola <strong>${userName}</strong>,</p>
    
    <p>¡Gracias por registrarte! Estamos emocionados de tenerte con nosotros. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a usar nuestro sistema de gestión de tickets.</p>
    
    <div class="info-box">
      <p><strong>✓ Tu cuenta está activa</strong></p>
      <p>Ya puedes acceder a todas las funcionalidades del sistema.</p>
    </div>
    
    <p><strong>¿Qué puedes hacer ahora?</strong></p>
    <ul style="margin: 15px 0; padding-left: 20px; color: #495057;">
      <li>Crear y gestionar tickets</li>
      <li>Colaborar con tu equipo</li>
      <li>Hacer seguimiento de tus solicitudes</li>
      <li>Acceder a la base de conocimientos</li>
    </ul>
    
    ${
      loginLink
        ? `
      <div style="text-align: center;">
        <a href="${loginLink}" class="button">Acceder al Sistema</a>
      </div>
    `
        : ''
    }
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      Si necesitas ayuda o tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte!
    </p>
  `;

  return baseEmailTemplate(content, 'Bienvenido a Sistema de Tickets');
};

export const ticketCreatedTemplate = (
  ticketId: string,
  ticketTitle: string,
  customerName: string,
  ticketLink?: string,
) => {
  const content = `
    <h2>Nuevo Ticket Creado 🎫</h2>
    
    <p>Hola <strong>${customerName}</strong>,</p>
    
    <p>Tu ticket ha sido creado exitosamente. Nuestro equipo lo revisará lo antes posible.</p>
    
    <div class="info-box">
      <p><strong>ID del Ticket:</strong> #${ticketId}</p>
      <p><strong>Asunto:</strong> ${ticketTitle}</p>
      <p><strong>Estado:</strong> Abierto</p>
    </div>
    
    <p>Recibirás actualizaciones automáticas cuando haya cambios en tu ticket.</p>
    
    ${
      ticketLink
        ? `
      <div style="text-align: center;">
        <a href="${ticketLink}" class="button">Ver Ticket</a>
      </div>
    `
        : ''
    }
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      <strong>Tiempo estimado de respuesta:</strong> 24-48 horas<br>
      Puedes hacer seguimiento de tu ticket en cualquier momento.
    </p>
  `;

  return baseEmailTemplate(content, 'Ticket Creado');
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
    abierto: '#28a745',
    en_progreso: '#ffc107',
    resuelto: '#17a2b8',
    cerrado: '#6c757d',
  };

  const statusColor = statusColors[status.toLowerCase()] || '#667eea';

  const content = `
    <h2>Actualización de Ticket 🔔</h2>
    
    <p>Hola <strong>${customerName}</strong>,</p>
    
    <p>Tu ticket ha sido actualizado. Aquí están los detalles:</p>
    
    <div class="info-box">
      <p><strong>ID del Ticket:</strong> #${ticketId}</p>
      <p><strong>Asunto:</strong> ${ticketTitle}</p>
      <p><strong>Estado:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status.toUpperCase()}</span></p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #212529;"><strong>Actualización:</strong></p>
      <p style="margin: 10px 0 0 0; color: #495057;">${updateMessage}</p>
    </div>
    
    ${
      ticketLink
        ? `
      <div style="text-align: center;">
        <a href="${ticketLink}" class="button">Ver Detalles del Ticket</a>
      </div>
    `
        : ''
    }
    
    <p style="font-size: 14px; color: #6c757d; margin-top: 20px;">
      Gracias por tu paciencia. Seguimos trabajando para resolver tu solicitud.
    </p>
  `;

  return baseEmailTemplate(content, 'Actualización de Ticket');
};

export const passwordChangedTemplate = (userName: string) => {
  const content = `
    <h2>Contraseña Cambiada Exitosamente ✓</h2>
    
    <p>Hola <strong>${userName}</strong>,</p>
    
    <p>Te confirmamos que la contraseña de tu cuenta ha sido cambiada exitosamente.</p>
    
    <div class="info-box">
      <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-ES', {
        dateStyle: 'full',
        timeStyle: 'short',
      })}</p>
    </div>
    
    <p><strong>Si no realizaste este cambio:</strong></p>
    <p style="color: #dc3545;">Por favor, contacta inmediatamente a nuestro equipo de soporte. Tu cuenta podría estar comprometida.</p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      Este es un correo de notificación de seguridad para mantener tu cuenta protegida.
    </p>
  `;

  return baseEmailTemplate(content, 'Contraseña Cambiada');
};

export const accountVerificationTemplate = (
  verificationLink: string,
  userName: string,
) => {
  const content = `
    <h2>Verificación de Cuenta</h2>
    
    <p>Hola <strong>${userName}</strong>,</p>
    
    <p>Gracias por registrarte en nuestro Sistema de Tickets. Para completar tu registro y activar tu cuenta, por favor verifica tu correo electrónico haciendo clic en el botón de abajo.</p>
    
    <div class="info-box">
      <p><strong>⏰ Este enlace expirará en 24 horas</strong></p>
      <p>Por razones de seguridad, este enlace solo puede ser usado una vez.</p>
    </div>
    
    <p>Para verificar tu cuenta, haz clic en el siguiente botón:</p>
    
    <div style="text-align: center;">
      <a href="${verificationLink}" class="button">Verificar Correo Electrónico</a>
    </div>
    
    <p style="font-size: 14px; color: #6c757d; margin-top: 20px;">
      Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
    </p>
    <p style="font-size: 14px; word-break: break-all; color: #667eea;">
      ${verificationLink}
    </p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      <strong>Consejos de seguridad:</strong><br>
      • No compartas este enlace con nadie<br>
      • Si no creaste una cuenta, puedes ignorar este correo de forma segura<br>
      • Una vez verificado, podrás iniciar sesión en el sistema
    </p>
  `;

  return baseEmailTemplate(content, 'Verificación de Cuenta');
};

export const accountVerificationCodeTemplate = (
  verificationCode: string,
  userName: string,
) => {
  const content = `
    <h2>Verificacion de Cuenta</h2>
    
    <p>Hola <strong>${userName}</strong>,</p>
    
    <p>Gracias por registrarte en nuestro Sistema de Tickets. Para completar tu registro, ingresa el siguiente codigo en la pantalla de verificacion.</p>
    
    <div class="info-box" style="text-align: center;">
      <p style="font-size: 20px; font-weight: bold; letter-spacing: 4px; margin: 0;">
        ${verificationCode}
      </p>
      <p style="margin-top: 10px;"><strong>⏰ Este codigo expirara en 15 minutos</strong></p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">
      <strong>Consejos de seguridad:</strong><br>
      • No compartas este codigo con nadie<br>
      • Si no creaste una cuenta, puedes ignorar este correo<br>
      • Una vez verificado, podras iniciar sesion en el sistema
    </p>
  `;

  return baseEmailTemplate(content, 'Verificacion de Cuenta');
};
