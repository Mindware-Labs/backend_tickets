<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Descripción del Proyecto

**Tickets API** es un sistema backend robusto para la gestión integral de tickets de soporte y atención al cliente, desarrollado con NestJS y TypeScript. El proyecto proporciona una solución completa para administrar interacciones con clientes, campañas de marketing y seguimiento de llamadas.

### Características Principales

- **🎫 Gestión de Tickets**: Sistema completo CRUD para crear, actualizar y rastrear tickets de soporte con diferentes tipos de gestión (Onboarding, AR), prioridades y estados.

- **👥 Administración de Clientes**: Módulo dedicado para gestionar información de clientes incluyendo datos de contacto, empresas asociadas y patios (yards).

- **📊 Campañas**: Sistema de gestión de campañas con soporte para diferentes tipos (Onboarding, AR, Other), seguimiento de duración y estado activo/inactivo.

- **🔐 Autenticación y Seguridad**: Sistema completo de autenticación con JWT incluyendo:
  - Registro y login de usuarios
  - Recuperación de contraseña con tokens
  - Protección de rutas con guards
  - Roles de usuario

- **📞 Integración con Aircall**: Webhook listener para capturar y procesar eventos de llamadas entrantes y salientes desde Aircall, permitiendo tracking automático de interacciones telefónicas.

- **📚 Documentación API con Swagger**: Documentación interactiva completa de todos los endpoints disponible en `/api`, facilitando la integración y pruebas.

### Tecnologías Utilizadas

- **Framework**: NestJS 11.x
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL con TypeORM
- **Autenticación**: JWT con Passport
- **Validación**: Class Validator & Class Transformer
- **Documentación**: Swagger/OpenAPI
- **Seguridad**: Bcrypt para encriptación de contraseñas

### Endpoints Disponibles

- **Auth**: `/auth` - Registro, login, recuperación de contraseña
- **Tickets**: `/ticket` - CRUD completo de tickets
- **Clientes**: `/customers` - Gestión de clientes
- **Campañas**: `/campaign` - Administración de campañas
- **Webhooks**: `/webhooks/aircall` - Receptor de eventos Aircall
- **Documentación**: `/api` - Swagger UI

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

- **Base de datos**: Configura PostgreSQL
- **Aircall API**: Obtén tus credenciales en [Aircall Dashboard](https://dashboard.aircall.io/company/integrations)
- **Webhook Token**: Configura el token para validar webhooks

### 3. Configurar Base de Datos

```bash
# Ejecuta las migraciones (si usas TypeORM migrations)
npm run migration:run
```

### 4. Configurar Webhook en Aircall

1. Ve a [Aircall Webhooks](https://dashboard.aircall.io/integrations/webhooks)
2. Crea un nuevo webhook con:
   - **URL**: `https://tu-dominio.com/webhooks/aircall`
   - **Eventos**: Selecciona `call.created`, `call.answered`, `call.ended`, etc.

**Para desarrollo local con ngrok:**

```bash
# Instala ngrok: https://ngrok.com/download
ngrok http 3000

# Usa la URL de ngrok: https://abc123.ngrok.io/webhooks/aircall
```

## Ejecutar la aplicación

```bash
# development
npm run start

# watch mode (recomendado para desarrollo)
npm run start:dev

# production mode
npm run start:prod
```

## Probar Webhooks de Aircall

### Opción 1: Usando el archivo HTTP

Abre `test-aircall-webhook.http` en VS Code con la extensión REST Client y ejecuta las peticiones de prueba.

### Opción 2: Usando cURL

```bash
curl -X POST http://localhost:3000/webhooks/aircall \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call.ended",
    "timestamp": 1702742400,
    "token": "test-token",
    "data": {
      "id": 12345,
      "direction": "inbound",
      "from": "+34612345678",
      "to": "+34987654321",
      "duration": 95
    }
  }'
```

### Opción 3: Con webhooks reales

1. Expón tu servidor local con ngrok
2. Configura la URL en Aircall
3. Realiza una llamada de prueba en Aircall

## Verificar Datos

```sql
-- Ver eventos de webhook recibidos
SELECT * FROM webhook_events ORDER BY "receivedAt" DESC LIMIT 10;

-- Ver llamadas registradas
SELECT * FROM calls ORDER BY "createdAt" DESC LIMIT 10;
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
