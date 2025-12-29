
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

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

  // ⚠️ CLAVE PARA RAILWAY: Usar PORT de entorno y ESCUCHAR EN 0.0.0.0
  const port = process.env.PORT || '3000';
  
  // Añadir manejo de señales para shutdown limpio
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing HTTP server.');
    app.close();
  });

  await app.listen(port, '0.0.0.0');  // ← ESTA LÍNEA ES LA CLAVE
  
  console.log(`✅ Application is running on: http://0.0.0.0:${port}`);
  console.log(`📚 Swagger documentation: http://0.0.0.0:${port}/api`);
  console.log(`🌍 Health check: http://0.0.0.0:${port}/health`);
  console.log(`📞 Aircall webhook: http://0.0.0.0:${port}/webhooks/aircall`);
}
bootstrap();