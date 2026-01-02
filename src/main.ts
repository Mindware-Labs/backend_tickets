import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';

  // Security: Helmet
  app.use(helmet());

  // Performance: Compression
  app.use(compression());

  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: isProduction ? allowedOrigins : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger: Only in development
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Tickets API')
      .setDescription('API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || '3000';

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing application...');
    app.close();
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, closing application...');
    app.close();
  });

  await app.listen(port, '0.0.0.0');

  console.log(`✅ Server running on: http://0.0.0.0:${port}`);
  console.log(`🔒 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  if (!isProduction) {
    console.log(`📄 Swagger UI: http://0.0.0.0:${port}/docs`);
  }
  console.log(`🏥 Health Check: http://0.0.0.0:${port}/health`);
}
bootstrap();
