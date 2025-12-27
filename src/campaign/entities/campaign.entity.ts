import { Ticket } from 'src/ticket/entities/ticket.entity';
import { Yard } from '../../yards/entities/yard.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
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

  //@OneToMany(() => Yard, (yard) => yard.campaign)
  //yards: Yard[];

  @OneToMany(() => Ticket, (ticket) => ticket.campaign)
  tickets: Ticket[];
}
