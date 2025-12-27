import { Ticket } from '../../ticket/entities/ticket.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Landlord } from 'src/landlords/entities/landlord.entity';

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

  @Column()
  isActive: boolean;

  @Column({ nullable: true })
  landlordId?: number | null;

  @ManyToOne(() => Landlord, (landlord) => landlord.yards, { nullable: true })
  @JoinColumn({ name: 'landlordId' })
  landlord?: Landlord | null;

  @OneToMany(() => Campaign, (campaign) => campaign.yarda)
  campaigns: Campaign[];

  @OneToMany(() => Ticket, (ticket) => ticket.yard)
  tickets: Ticket[];

}
