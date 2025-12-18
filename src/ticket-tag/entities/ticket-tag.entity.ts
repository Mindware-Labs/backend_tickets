import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Ticket } from '../../ticket/entities/ticket.entity';

export enum TagType {
  CATEGORY = 'CATEGORY',
  DEPARTMENT = 'DEPARTMENT',
  CUSTOM = 'CUSTOM',
}

@Entity('ticket_tags')
export class TicketTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  color?: string;

  @Column({
    type: 'enum',
    enum: TagType,
    default: TagType.CUSTOM,
  })
  type: TagType;

  @ManyToMany(() => Ticket, (ticket) => ticket.tags)
  tickets: Ticket[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
