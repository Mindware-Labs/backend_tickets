import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailPreviewController } from './email-preview.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [EmailPreviewController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
