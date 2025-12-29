import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 1. NO Usamos app.setGlobalPrefix (Para que /health siga funcionando en la raíz)

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

  const config = new DocumentBuilder()
    .setTitle('Tickets API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  
  // 👇 CAMBIO IMPORTANTE: Swagger ahora está en /docs para no chocar con /api/...
  SwaggerModule.setup('docs', app, document); 

  const port = process.env.PORT || '3000';
  
  process.on('SIGTERM', () => {
    app.close();
  });

  await app.listen(port, '0.0.0.0');
  
  console.log(`✅ Server running on: http://0.0.0.0:${port}`);
  console.log(`📄 Swagger UI: http://0.0.0.0:${port}/docs`); // <--- Nueva ruta Swagger
  console.log(`🏥 Health Check: http://0.0.0.0:${port}/health`);
}
bootstrap();