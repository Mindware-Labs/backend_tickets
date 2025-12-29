// ===== SOLUCIÓN PARA ERRORES EROFS EN RAILWAY =====
process.on('uncaughtException', (error: any) => {
  if (error.code === 'EROFS' && error.path && error.path.includes('.log')) {
    console.warn('[RAILWAY] Log file write intercepted:', error.path);
    return;
  }
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  if (reason?.code === 'EROFS' && reason?.path?.includes('.log')) {
    console.warn('[RAILWAY] Async log write intercepted');
    return;
  }
  console.error('🚨 Unhandled Rejection:', reason);
});

// Configurar AWS SDK para producción (sin monkey-patching)
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = '1';
// ===== FIN DE LA SOLUCIÓN =====

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  // Log de inicio para debug
  console.log('🚀 Starting Tickets API...');
  console.log('📦 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔧 Port:', process.env.PORT || '3000');
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Tickets API')
    .setDescription(
      'API for managing tickets, customers, campaigns, webhooks, yards, and knowledge base',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication and user management')
    .addTag('tickets', 'Ticket management')
    .addTag('customers', 'Customer management')
    .addTag('campaigns', 'Campaign management')
    .addTag('yards', 'Yard management (container yards)')
    .addTag('knowledge', 'Knowledge base management')
    .addTag('webhooks', 'Integration webhooks')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || '3000';
  
  // Manejo de señales para shutdown limpio
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    app.close();
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    app.close();
  });

  // ⚠️ CLAVE PARA RAILWAY: Escuchar en 0.0.0.0
  await app.listen(port, '0.0.0.0');
  
  console.log('✅ ==========================================');
  console.log(`✅ Application is running on: http://0.0.0.0:${port}`);
  console.log(`✅ Health check: http://0.0.0.0:${port}/health`);
  console.log(`✅ Swagger documentation: http://0.0.0.0:${port}/api`);
  console.log(`✅ Aircall webhook: http://0.0.0.0:${port}/webhooks/aircall`);
  console.log('✅ ==========================================');
}

bootstrap();