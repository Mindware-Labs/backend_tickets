import { Module } from '@nestjs/common';
import { WebHookEventService } from './web-hook-event.service';
import { WebHookEventController } from './web-hook-event.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEvent } from './entities/web-hook-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookEvent])],
  controllers: [WebHookEventController],
  providers: [WebHookEventService],
})
export class WebHookEventModule {}
