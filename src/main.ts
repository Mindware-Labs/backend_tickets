// ===== PRIMERO: Aplicar el fix para AWS Logger =====
import { disableAWSFileLogging } from './aws-logger-fix';
disableAWSFileLogging();
// ===== FIN DEL FIX =====

// ===== SEGUNDO: Interceptar errores de filesystem =====
process.on('uncaughtException', (error: any) => {
  if (error.code === 'EROFS' && error.path && error.path.includes('.log')) {
    console.warn('[SERVERLESS] Log file write intercepted:', error.path);
    return;
  }
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  if (reason?.code === 'EROFS' && reason?.path?.includes('.log')) {
    console.warn('[SERVERLESS] Async log write intercepted');
    return;
  }
  console.error('Unhandled Rejection:', reason);
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.enableCors({
    origin: '*', // In production, specify allowed domains
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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(` Application is running on: http://localhost:${port}`);
  console.log(` Swagger documentation: http://localhost:${port}/api`);
  console.log(
    ` Aircall webhook endpoint: http://localhost:${port}/webhooks/aircall`,
  );
}
bootstrap();
