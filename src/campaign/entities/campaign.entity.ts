import { Yard } from '../../yards/entities/yard.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
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
  yardaId: number;

  @ManyToOne(() => Yard, (yarda) => yarda.campaigns)
  yarda: Yard;

  @Column({ nullable: true })
  duracion?: string;

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
