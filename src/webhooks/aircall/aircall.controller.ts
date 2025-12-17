import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AircallService } from './aircall.service';
import { AircallWebhookDto } from './dto/aircall-webhook.dto';

@Controller('webhooks/aircall')
export class AircallController {
  private readonly logger = new Logger(AircallController.name);

  constructor(private readonly aircallService: AircallService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    this.logger.log(
      `Received Aircall webhook: ${payload?.event || 'undefined'}`,
    );
    this.logger.debug(`Raw payload: ${JSON.stringify(payload)}`);

    try {
      await this.aircallService.ingest(payload);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
