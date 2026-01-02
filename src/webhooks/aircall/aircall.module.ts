import { Module } from '@nestjs/common';
import { AircallController } from './aircall.controller';
import { AircallService } from './aircall.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { CustomersModule } from '../../customers/customers.module';
import { User } from '../../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Customer, Agent, User]),
    CustomersModule,
  ],
  controllers: [AircallController],
  providers: [AircallService],
})
export class AircallModule {}
