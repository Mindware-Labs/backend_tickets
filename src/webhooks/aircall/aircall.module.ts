import { Module } from '@nestjs/common';
import { AircallController } from './aircall.controller';
import { AircallService } from './aircall.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEvent } from '../../web-hook-event/entities/web-hook-event.entity';
import { Call } from '../../call/entities/call.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookEvent, Call])],
  controllers: [AircallController],
  providers: [AircallService],
})
export class AircallModule {}
