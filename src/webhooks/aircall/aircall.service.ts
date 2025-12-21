import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEvent } from '../../web-hook-event/entities/web-hook-event.entity';
import {
  Ticket,
  ContactSource,
  ManagementType,
  TicketPriority,
  TicketStatus,
  CallDirection,
  OnboardingOption,
} from '../../ticket/entities/ticket.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { AircallWebhookDto, AircallCallData } from './dto/aircall-webhook.dto';

@Injectable()
export class AircallService {
  private readonly logger = new Logger(AircallService.name);

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
   Procesa un webhook de Aircall:
   Guarda el evento en webhook_events
   Crea directamente el ticket desde la llamada
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

    // Solo crear ticket cuando la llamada termina
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

      // fromNumber: quien llamó
      // inbound: quien recibió
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

        const ONBOARDING_NUMBERS = [
          '+17864537888',
          '+1 786-453-7888',
          '17864537888',
        ];
        const isOnBoardingLine =
          (data.number?.digits &&
            ONBOARDING_NUMBERS.includes(data.number.digits)) ||
          ONBOARDING_NUMBERS.some(
            (num) =>
              inboundNumber?.replace(/[^\d+]/g, '') ===
                num.replace(/[^\d+]/g, '') ||
              data.number?.digits?.replace(/[^\d+]/g, '') ===
                num.replace(/[^\d+]/g, ''),
          );

        this.logger.log(
          `Customer phone: ${phoneNumber}, isOnBoarding: ${isOnBoardingLine}`,
        );

        customer = this.customerRepo.create({
          name: fullName,
          phone: phoneNumber,
          isOnBoarding: isOnBoardingLine,
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

      const campaignValue = customer.isOnBoarding
        ? ManagementType.ONBOARDING
        : undefined;

      const ticketData: Partial<Ticket> = {
        customerId: customer.id,
        customerPhone: phoneNumber,

        yarda: undefined,

        disposition: undefined,

        direction: direction as CallDirection,

        campaign: campaignValue,

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
        `Ticket ${ticketNumber} created successfully from Aircall webhook ${data.id} (campaign: ${campaignValue}, isOnBoarding: ${customer.isOnBoarding})`,
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
