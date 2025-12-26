import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebHookEventModule } from './web-hook-event/web-hook-event.module';
import { typeOrmConfig } from './config/typeorm.config';
import { AircallModule } from './webhooks/aircall/aircall.module';
import { CustomersModule } from './customers/customers.module';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { TicketModule } from './ticket/ticket.module';
import { CampaignModule } from './campaign/campaign.module';
import { YardsModule } from './yards/yards.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { PoliciesModule } from './policies/policies.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), 'tickets', '.env'),
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        typeOrmConfig(configService),
    }),
    WebHookEventModule,
    AircallModule,
    CustomersModule,
    AgentsModule,
    AuthModule,
    TicketModule,
    CampaignModule,
    YardsModule,
    KnowledgeModule,
    PoliciesModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
