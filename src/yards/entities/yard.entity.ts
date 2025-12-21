import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ type: 'varchar', length: 200 })
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
}
