import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Habilitar CORS para permitir webhooks de Aircall
  app.enableCors({
    origin: '*', // En producción, especifica los dominios permitidos
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
    .setDescription(
      'API para gestión de tickets, clientes, campañas y webhooks',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación y gestión de usuarios')
    .addTag('tickets', 'Gestión de tickets')
    .addTag('customers', 'Gestión de clientes')
    .addTag('campaigns', 'Gestión de campañas')
    .addTag('webhooks', 'Webhooks de integración')
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
