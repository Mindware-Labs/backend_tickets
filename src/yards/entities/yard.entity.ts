import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ default: true })
  isActive: boolean;
}
