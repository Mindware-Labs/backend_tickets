import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CampaignType {
  ONBOARDING = 'ONBOARDING',
  AR = 'AR',
  OTHER = 'OTHER',
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ nullable: true })
  yarda?: string;

  @Column({ nullable: true, comment: 'Duración en minutos' })
  duracion?: number;

  @Column({
    type: 'enum',
    enum: CampaignType,
  })
  tipo: CampaignType;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
