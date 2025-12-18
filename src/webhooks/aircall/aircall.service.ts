import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEvent } from '../../web-hook-event/entities/web-hook-event.entity';
import { Call } from '../../call/entities/call.entity';
import {
  Ticket,
  ContactSource,
  ManagementType,
  TicketPriority,
} from '../../ticket/entities/ticket.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { CustomersService } from '../../customers/customers.service';
import { AircallWebhookDto, AircallCallData } from './dto/aircall-webhook.dto';

@Injectable()
export class AircallService {
  private readonly logger = new Logger(AircallService.name);

  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepo: Repository<WebhookEvent>,
    @InjectRepository(Call)
    private readonly callRepo: Repository<Call>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly customersService: CustomersService,
  ) {}

  /**
   Procesa un webhook de Aircall:
   Guarda el evento en webhook_events
   Crea o actualiza la llamada en calls
   */
  async ingest(payload: AircallWebhookDto): Promise<void> {
    this.logger.log(`Received webhook event: ${payload.event || 'UNKNOWN'}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

    if (!payload.event) {
      this.logger.warn('Webhook received without event type');
    }

    const webhookEvent = this.webhookEventRepo.create({
      provider: 'AIRCALL',
      eventType: payload.event || 'UNKNOWN',
      token: payload.token || '',
      providerCallId: payload.data?.id?.toString(),
      payload: payload as any,
      status: 'RECEIVED',
    });

    await this.webhookEventRepo.save(webhookEvent);

    try {
      await this.processCall(payload.data, payload.event);

      webhookEvent.status = 'PROCESSED';
      await this.webhookEventRepo.save(webhookEvent);
    } catch (error) {
      this.logger.error(
        `Error processing webhook: ${error.message}`,
        error.stack,
      );

      webhookEvent.status = 'FAILED';
      webhookEvent.error = error.message;
      await this.webhookEventRepo.save(webhookEvent);

      throw error;
    }
  }

  private async processCall(
    data: AircallCallData,
    eventType: string,
  ): Promise<void> {
    if (!data || !data.id) {
      this.logger.warn('No call data in webhook payload');
      return;
    }

    this.logger.log(`Processing call ID: ${data.id}`);

    const providerCallId = data.id.toString();

    let call = await this.callRepo.findOne({
      where: { providerCallId },
    });

    const isNewCall = !call;

    if (!call) {
      this.logger.log(`Creating new call for ID: ${providerCallId}`);
      call = this.callRepo.create({
        provider: 'AIRCALL',
        providerCallId,
        fromNumber: data.from || data.raw_digits || 'unknown',
        toNumber: data.to || data.number?.digits || 'unknown',
        direction: this.mapDirection(data.direction),
        outcome: 'UNKNOWN',
        raw: data as any,
      });
    } else {
      this.logger.log(`Updating existing call: ${providerCallId}`);
    }

    if (data.started_at) {
      call.startedAt = new Date(data.started_at * 1000);
    }

    if (data.ended_at) {
      call.endedAt = new Date(data.ended_at * 1000);
    }

    if (data.duration) {
      call.durationSec = data.duration;
    }

    call.outcome = this.determineOutcome(data, eventType);

    if (data.user?.name) {
      call.agentName = data.user.name;
    } else if (data.assigned_to?.name) {
      call.agentName = data.assigned_to.name;
    }

    if (data.recording) {
      call.recordingUrl = data.recording;
    }

    call.raw = data as any;

    try {
      await this.callRepo.save(call);
      this.logger.log(
        `Call ${providerCallId} ${isNewCall ? 'created' : 'updated'} successfully`,
      );

      if (isNewCall) {
        await this.createTicketFromCall(call, data);
      }
    } catch (error) {
      this.logger.error(
        `Failed to save call ${providerCallId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async createTicketFromCall(
    call: Call,
    data: AircallCallData,
  ): Promise<void> {
    try {
      this.logger.log(`Creating ticket for call ${call.providerCallId}`);

      const phoneNumber =
        call.direction === 'INBOUND' ? call.fromNumber : call.toNumber;
      let customer = await this.customerRepo.findOne({
        where: { phone: phoneNumber },
      });

      if (!customer) {
        this.logger.log(`Creating new customer for phone: ${phoneNumber}`);
        customer = this.customerRepo.create({
          name: 'Cliente',
          lastName: phoneNumber,
          phone: phoneNumber,
          email: `${phoneNumber}@temp.com`,
        });
        await this.customerRepo.save(customer);
      }

      const count = await this.ticketRepo.count();
      const ticketNumber = `#${(count + 1).toString().padStart(4, '0')}`;

      const source =
        call.direction === 'INBOUND'
          ? ContactSource.AIRCALL_INBOUND
          : ContactSource.AIRCALL_OUTBOUND;

      const ticket = this.ticketRepo.create({
        ticketNumber,
        managementType: ManagementType.AR,
        subject: `Llamada ${call.direction === 'INBOUND' ? 'entrante' : 'saliente'} - ${phoneNumber}`,
        issueDetail: `Llamada ${call.outcome} con duración de ${call.durationSec || 0} segundos`,
        source,
        contactChannel: `Aircall - ${call.agentName || 'Sin agente'}`,
        customerId: customer.id,
        createdByUserId: 1,
        priority: TicketPriority.MEDIUM,
      });

      await this.ticketRepo.save(ticket);
      this.logger.log(
        `Ticket ${ticketNumber} created successfully for call ${call.providerCallId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create ticket for call ${call.providerCallId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private mapDirection(direction: string): 'INBOUND' | 'OUTBOUND' {
    return direction === 'inbound' ? 'INBOUND' : 'OUTBOUND';
  }

  private determineOutcome(
    data: AircallCallData,
    eventType: string,
  ): 'ANSWERED' | 'MISSED' | 'VOICEMAIL' | 'UNKNOWN' {
    if (data.voicemail) {
      return 'VOICEMAIL';
    }

    if (data.answered_at) {
      return 'ANSWERED';
    }

    if (
      data.missed_call_reason ||
      (eventType === 'call.ended' && !data.answered_at)
    ) {
      return 'MISSED';
    }

    if (data.status === 'done' && data.duration && data.duration > 0) {
      return 'ANSWERED';
    }

    return 'UNKNOWN';
  }
}
