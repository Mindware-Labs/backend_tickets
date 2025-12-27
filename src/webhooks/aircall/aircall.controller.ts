import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AircallService } from './aircall.service';
import { AircallWebhookDto } from './dto/aircall-webhook.dto';

@ApiTags('webhooks')
@Controller('webhooks/aircall')
export class AircallController {
  private readonly logger = new Logger(AircallController.name);
  private readonly webhookToken: string;

  constructor(
    private readonly aircallService: AircallService,
    private readonly configService: ConfigService,
  ) {
    this.webhookToken =
      this.configService.get<string>('AIRCALL_WEBHOOK_TOKEN') || '';
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Aircall webhook' })
  @ApiBody({ type: Object, description: 'Aircall webhook payload' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async handleWebhook(@Body() payload: any) {
    this.logger.log(
      `Received Aircall webhook: ${payload?.event || 'undefined'}`,
    );
    this.logger.debug(`Raw payload: ${JSON.stringify(payload)}`);

    if (this.webhookToken && payload.token !== this.webhookToken) {
      this.logger.warn(
        `Invalid webhook token received. Expected: ${this.webhookToken}, Got: ${payload.token}`,
      );

      return { success: false, error: 'Invalid token' };
    }

    try {
      this.aircallService.ingest(payload).catch((error) => {
        this.logger.error(
          `Background error processing webhook: ${error.message}`,
          error.stack,
        );
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error processing webhook: ${error.message}`,
        error.stack,
      );
      return { success: true, note: 'Processing in background' };
    }
  }
}
