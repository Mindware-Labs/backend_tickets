import { Module } from '@nestjs/common';
import { YardsService } from './yards.service';
import { YardsController } from './yards.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Yard } from './entities/yard.entity';
import { Ticket } from '../ticket/entities/ticket.entity';
import { Campaign } from '../campaign/entities/campaign.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Yard, Ticket, Campaign])],
  controllers: [YardsController],
  providers: [YardsService],
})
export class YardsModule {}
