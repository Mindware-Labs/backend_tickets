import { Module } from '@nestjs/common';
import { AircallController } from './aircall.controller';
import { AircallService } from './aircall.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEvent } from '../../web-hook-event/entities/web-hook-event.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { CustomersModule } from '../../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent, Ticket, Customer, Agent]),
    CustomersModule,
  ],
  controllers: [AircallController],
  providers: [AircallService],
})
export class AircallModule {}
