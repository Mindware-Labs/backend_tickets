import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('knowledge')
export class Knowledge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;
}
