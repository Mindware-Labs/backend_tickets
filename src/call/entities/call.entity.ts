import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  provider: 'AIRCALL';

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  providerCallId: string; // UNIQUE para no duplicar

  @Column({ type: 'varchar', length: 30 })
  fromNumber: string;

  @Column({ type: 'varchar', length: 30 })
  toNumber: string;

  @Column({ type: 'varchar', length: 10 })
  direction: 'INBOUND' | 'OUTBOUND';

  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt?: Date;

  @Column({ type: 'int', nullable: true })
  durationSec?: number;

  @Column({ type: 'varchar', length: 15, default: 'UNKNOWN' })
  outcome: 'ANSWERED' | 'MISSED' | 'VOICEMAIL' | 'UNKNOWN';

  @Column({ type: 'varchar', length: 120, nullable: true })
  agentName?: string;

  @Column({ type: 'text', nullable: true })
  recordingUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  raw?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
