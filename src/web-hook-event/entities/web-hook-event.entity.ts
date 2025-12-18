import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  provider: 'AIRCALL';

  @Column({ type: 'varchar', length: 100 })
  eventType: string; // ej: "call.ended"

  @Column({ type: 'varchar', length: 200, nullable: true })
  token?: string;

  @Index()
  @Column({ type: 'varchar', length: 120, nullable: true })
  providerCallId?: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'varchar', length: 20, default: 'RECEIVED' })
  status: 'RECEIVED' | 'PROCESSED' | 'FAILED';

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn()
  receivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;
}
