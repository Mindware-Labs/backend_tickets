import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { Ticket } from './entities/ticket.entity';
import { Yard } from '../yards/entities/yard.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { Agent } from '../agents/entities/agent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Yard, Customer, Campaign, Agent]),
  ],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}
