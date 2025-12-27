import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEvent } from '../../web-hook-event/entities/web-hook-event.entity';
import {
  Ticket,
  TicketPriority,
  TicketStatus,
  CallDirection,
} from '../../ticket/entities/ticket.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { AircallWebhookDto, AircallCallData } from './dto/aircall-webhook.dto';

@Injectable()
export class AircallService {
  private readonly logger = new Logger(AircallService.name);
  private readonly allowedLineNumbers = new Set([
    '17864537888', // Rig Hut – Onboard and Support
    '13143967179', // Drop Yard STL
    '17864716281', // Griffin Truck Parking
    '12512835404', // Gulf Coast Truck Storage
    '17622275486', // I-85 Truck Parking
    '15615568710', // Mr. Parker – Hollywood
    '15614897958', // Mr. Parker – Riviera Beach
    '19013506669', // National Truck Parking
    '19042659233', // Parking Kingdom Jackson
    '13054130294', // Rig Hut - Main Office Number
    '18558601514', // Rig Hut - Toll Free Number
  ]);

  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepo: Repository<WebhookEvent>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
  ) {}

  /**
   Processes an Aircall webhook:
   Saves the event in webhook_events
   Creates the ticket directly from the call
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
      await this.processAircallWebhook(payload.data, payload.event);

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

  private async processAircallWebhook(
    data: AircallCallData,
    eventType: string,
  ): Promise<void> {
    if (!data || !data.id) {
      this.logger.warn('No call data in webhook payload');
      return;
    }

    // Only create a ticket when the call ends
    if (eventType !== 'call.ended') {
      this.logger.log(
        `Skipping ticket creation for event type: ${eventType}. Only processing call.ended events.`,
      );
      return;
    }

    this.logger.log(`Processing Aircall webhook ID: ${data.id}`);

    try {
      await this.createTicketFromAircall(data, eventType);
    } catch (error) {
      this.logger.error(
        `Failed to process Aircall webhook ${data.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async createTicketFromAircall(
    data: AircallCallData,
    eventType: string,
  ): Promise<void> {
    try {
      this.logger.log(`Creating ticket from Aircall webhook ${data.id}`);

      const direction = this.mapDirection(data.direction);

      // fromNumber: caller
      // inboundNumber: recipient
      let fromNumber: string;
      let inboundNumber: string;

      if (direction === 'INBOUND') {
        fromNumber = data.from || data.raw_digits || 'unknown';
        inboundNumber = data.to || data.number?.digits || 'unknown';
      } else {
        fromNumber = data.number?.digits || 'unknown';
        inboundNumber = data.raw_digits || data.to || 'unknown';
      }

      const phoneNumber = direction === 'INBOUND' ? fromNumber : inboundNumber;

      const normalizePhone = (value?: string) =>
        value ? value.replace(/[^\d]/g, '') : '';
      const lineCandidates = [data.number?.digits, inboundNumber, data.to].map(
        normalizePhone,
      );
      const matchedLine = lineCandidates.find((value) =>
        this.allowedLineNumbers.has(value),
      );

      if (!matchedLine) {
        this.logger.warn(
          `Skipping ticket creation for Aircall ${data.id}: line not allowed (${lineCandidates.filter(Boolean).join(', ') || 'unknown'})`,
        );
        return;
      }

      this.logger.log(`Inbound number: ${inboundNumber}`);

      let customer = await this.customerRepo.findOne({
        where: { phone: phoneNumber },
      });

      if (!customer) {
        this.logger.log(`Creating new customer for phone: ${phoneNumber}`);

        const firstName = data.contact?.first_name || '';
        const lastName = data.contact?.last_name || '';
        const fullName =
          firstName && lastName
            ? `${firstName} ${lastName}`.trim()
            : firstName || lastName || phoneNumber;

        customer = this.customerRepo.create({
          name: fullName,
          phone: phoneNumber,
          isOnBoarding: false,
        });
        await this.customerRepo.save(customer);
      }

      let agentId: number | undefined;
      if (data.user?.email) {
        let agent = await this.agentRepo.findOne({
          where: { email: data.user.email },
        });

        if (!agent) {
          this.logger.log(`Creating agent: ${data.user.name}`);
          agent = this.agentRepo.create({
            name: data.user.name,
            email: data.user.email,
            aircallId: data.user.id?.toString(),
            isActive: true,
          });
          await this.agentRepo.save(agent);
        }
        agentId = agent.id;
      }

      const count = await this.ticketRepo.count();
      const ticketNumber = `#${(count + 1).toString().padStart(4, '0')}`;

      const ticketData: Partial<Ticket> = {
        customerId: customer.id,
        customerPhone: phoneNumber,

        yard: undefined,

        disposition: undefined,

        direction: direction as CallDirection,

        campaign: undefined,

        agentId: agentId,

        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.LOW,

        aircallId: data.id?.toString(),
        duration: data.duration || undefined,

        issueDetail: undefined,

        attachments: undefined,

        onboardingOption: undefined,
      };

      const ticket = this.ticketRepo.create(ticketData);

      await this.ticketRepo.save(ticket);
      this.logger.log(
        `Ticket ${ticketNumber} created successfully from Aircall webhook ${data.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create ticket from Aircall webhook: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private mapDirection(direction: string): 'INBOUND' | 'OUTBOUND' {
    return direction === 'inbound' ? 'INBOUND' : 'OUTBOUND';
  }
}
