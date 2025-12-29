import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 👇 CORRECCIÓN CLAVE:
  // Usamos el prefijo 'api', PERO dejamos '/health' y '/' fuera
  // para que Railway pueda encontrar la app y no la mate.
  app.setGlobalPrefix('api', {
    exclude: ['health', '/'], 
  });

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

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Tickets API')
    .setDescription('API for managing tickets, customers, etc.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Swagger estará en /api/docs
  SwaggerModule.setup('docs', app, document); 

  const port = process.env.PORT || '3000';
  
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing HTTP server.');
    app.close();
  });

  await app.listen(port, '0.0.0.0');
  
  console.log(`✅ Application is running on: http://0.0.0.0:${port}/api`);
  console.log(`🌍 Health Check is preserved at: http://0.0.0.0:${port}/health`);
}
bootstrap();