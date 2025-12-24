import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { Campaign } from './entities/campaign.entity';
import { Yard } from '../yards/entities/yard.entity';
import { Ticket } from '../ticket/entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, Yard, Ticket])],
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
