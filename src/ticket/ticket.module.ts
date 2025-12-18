import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { Ticket } from './entities/ticket.entity';
import { TicketTag } from '../ticket-tag/entities/ticket-tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, TicketTag])],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}
