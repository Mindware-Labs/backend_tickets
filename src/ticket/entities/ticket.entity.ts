import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToOne,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { Yard } from '../../yards/entities/yard.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
}

export enum CallDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  MISSED = 'MISSED',
}

export enum TicketDisposition {
  BOOKING = 'BOOKING',
  GENERAL_INFO = 'GENERAL_INFO',
  COMPLAINT = 'COMPLAINT',
  SUPPORT = 'SUPPORT',
  BILLING = 'BILLING',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
}

export enum ContactSource {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  WEB = 'WEB',
  CHAT = 'CHAT',
  AIRCALL_INBOUND = 'AIRCALL_INBOUND',
  AIRCALL_OUTBOUND = 'AIRCALL_OUTBOUND',
}

export enum OnboardingOption {
  NOT_REGISTER = 'NOT_REGISTERED',
  REGISTER = 'REGISTERED',
  PAID_WITH_LL = 'PAID_WITH_LL',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerId: number;

  @Column({ nullable: true })
  yardId?: number;

  @ManyToOne(() => Yard, (yard) => yard.tickets, {
    eager: true,
    nullable: true,
  })
  yard?: Yard;

  @Column({ nullable: true })
  customerPhone?: string;

  // Disposition (entered manually by the agent)
  @Column({
    type: 'enum',
    enum: TicketDisposition,
    nullable: true,
  })
  disposition?: TicketDisposition;

  // Direction (inbound or outbound call)
  @Column({
    type: 'enum',
    enum: CallDirection,
  })
  direction: CallDirection;

  // Campaign
  @Column({
    type: 'int',
    nullable: true,
  })
  campaignId?: number;

  @ManyToOne(() => Campaign, (campaing) => campaing.tickets, {
    eager: true,
    nullable: true,
  })
  campaign?: Campaign;

  @ManyToOne(() => Agent, { nullable: true })
  @JoinColumn({ name: 'agentId' })
  assignedTo?: Agent;

  @Column({ nullable: true })
  agentId?: number;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.IN_PROGRESS,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.LOW,
  })
  priority: TicketPriority;

  @Column({ nullable: true })
  aircallId?: string;

  @Column({ nullable: true, comment: 'Call duration in seconds' })
  duration?: number;

  // Issue detail (entered manually by the agent)
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Entered manually by the agent',
  })
  issueDetail?: string;

  // Attachment (entered manually by the agent)
  @Column({
    type: 'simple-json',
    nullable: true,
    comment: 'Entered manually by the agent',
  })
  attachments?: string[];

  // Onboarding Option (only when campaign is ONBOARDING)
  @Column({
    type: 'enum',
    enum: OnboardingOption,
    nullable: true,
    comment:
      'Only applies when campaign is ONBOARDING. Entered manually by the agent.',
  })
  onboardingOption?: OnboardingOption;

  // Created date
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
