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

## Project Description

**Tickets API** is a robust backend system for end-to-end support ticket and customer service management, built with NestJS and TypeScript. The project provides a complete solution to manage customer interactions, marketing campaigns, and call tracking.

### Key Features

- **🎫 Ticket Management**: Full CRUD system to create, update, and track support tickets with different management types (Onboarding, AR), priorities, and statuses.

- **👥 Customer Management**: Dedicated module to manage customer information including contact data, associated companies, and yards.

- **📊 Campaigns**: Campaign management system with support for different types (Onboarding, AR, Other), duration tracking, and active/inactive status.

- **🔐 Authentication and Security**: Complete JWT-based authentication system including:
  - User registration and login
  - Password recovery with tokens
  - Route protection with guards
  - User roles

- **📞 Aircall Integration**: Webhook listener to capture and process inbound and outbound call events from Aircall, enabling automatic tracking of phone interactions.

- **📚 API Documentation with Swagger**: Complete interactive documentation for all endpoints available at `/api`, making integration and testing easier.

### Technologies Used

- **Framework**: NestJS 11.x
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: Class Validator & Class Transformer
- **Documentation**: Swagger/OpenAPI
- **Security**: Bcrypt for password hashing

### Available Endpoints

- **Auth**: `/auth` - Registration, login, password recovery
- **Tickets**: `/ticket` - Full CRUD for tickets
- **Customers**: `/customers` - Customer management
- **Campaigns**: `/campaign` - Campaign management
- **Webhooks**: `/webhooks/aircall` - Aircall event receiver
- **Documentation**: `/api` - Swagger UI

## Initial Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the `.env.example` file to `.env` and set your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

- **Database**: Configure PostgreSQL
- **Aircall API**: Get your credentials in the [Aircall Dashboard](https://dashboard.aircall.io/company/integrations)
- **Webhook Token**: Set the token to validate webhooks

### 3. Configure the database

```bash
# Run migrations (if you use TypeORM migrations)
npm run migration:run
```

### 4. Configure the Aircall webhook

1. Go to [Aircall Webhooks](https://dashboard.aircall.io/integrations/webhooks)
2. Create a new webhook with:
   - **URL**: `https://your-domain.com/webhooks/aircall`
   - **Events**: Select `call.created`, `call.answered`, `call.ended`, etc.

**For local development with ngrok:**

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000

# Use the ngrok URL: https://abc123.ngrok.io/webhooks/aircall
```

## Run the application

```bash
# development
npm run start

# watch mode (recommended for development)
npm run start:dev

# production mode
npm run start:prod
```

## Test Aircall Webhooks

### Option 1: Using the HTTP file

Open `test-aircall-webhook.http` in VS Code with the REST Client extension and run the test requests.

### Option 2: Using cURL

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

### Option 3: With real webhooks

1. Expose your local server with ngrok
2. Configure the URL in Aircall
3. Make a test call in Aircall

## Verify Data

```sql
-- View tickets created from webhooks
SELECT * FROM tickets WHERE "aircallId" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 10;

-- View customers
SELECT * FROM customers ORDER BY "createdAt" DESC LIMIT 10;
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
