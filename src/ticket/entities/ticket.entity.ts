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
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { TicketTag } from '../../ticket-tag/entities/ticket-tag.entity';

export enum ManagementType {
  ONBOARDING = 'ONBOARDING',
  AR = 'AR',
}

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
}

export enum ContactSource {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  WEB = 'WEB',
  CHAT = 'CHAT',
  AIRCALL_INBOUND = 'AIRCALL_INBOUND',
  AIRCALL_OUTBOUND = 'AIRCALL_OUTBOUND',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  ticketNumber: string;

  @Column({
    type: 'enum',
    enum: ManagementType,
  })
  managementType: ManagementType;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  issueDetail: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column({
    type: 'enum',
    enum: ContactSource,
  })
  source: ContactSource;

  @Column({ nullable: true })
  contactChannel?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo?: User;

  @Column({ nullable: true })
  assignedToUserId?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @Column()
  createdByUserId: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerId: number;

  @ManyToMany(() => TicketTag, (tag) => tag.tickets)
  @JoinTable({
    name: 'ticket_tags_relation',
    joinColumn: { name: 'ticketId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: TicketTag[];

  @Column({ nullable: true })
  resolvedAt?: Date;

  @Column({ nullable: true })
  closedAt?: Date;

  @Column({ nullable: true })
  firstResponseAt?: Date;

  @Column({ nullable: true })
  dueDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
