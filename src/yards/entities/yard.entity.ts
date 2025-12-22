import { Ticket } from 'src/ticket/entities/ticket.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

export enum YardType {
  SAAS = 'SAAS',
  FULL_SERVICE = 'FULL_SERVICE',
}

@Entity('yards')
export class Yard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 300 })
  commonName: string;

  @Column({ type: 'varchar', length: 500 })
  propertyAddress: string;

  @Column({ type: 'varchar', length: 100 })
  contactInfo: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  yardLink: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: YardType,
  })
  yardType: YardType;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Campaign, (campaign) => campaign.yarda)
  campaigns: Campaign[];

  @OneToMany(() => Ticket, (ticket) => ticket.yard)
  tickets: Ticket[];
}
