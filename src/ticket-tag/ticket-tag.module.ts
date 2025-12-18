import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketTagService } from './ticket-tag.service';
import { TicketTagController } from './ticket-tag.controller';
import { TicketTag } from './entities/ticket-tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TicketTag])],
  controllers: [TicketTagController],
  providers: [TicketTagService],
  exports: [TicketTagService],
})
export class TicketTagModule {}
