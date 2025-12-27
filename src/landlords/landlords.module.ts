import { Module } from '@nestjs/common';
import { LandlordsService } from './landlords.service';
import { LandlordsController } from './landlords.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Yard } from '../yards/entities/yard.entity';
import { Landlord } from './entities/landlord.entity';
import { Ticket } from '../ticket/entities/ticket.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Landlord, Yard, Ticket]), EmailModule],
  controllers: [LandlordsController],
  providers: [LandlordsService],
})
export class LandlordsModule {}
