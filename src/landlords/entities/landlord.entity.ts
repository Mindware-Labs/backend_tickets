import { Yard } from '../../yards/entities/yard.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('landlords')
export class Landlord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 15 })
  phone: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @OneToMany(() => Yard, (yard) => yard.landlord)
  yards?: Yard[];
}
