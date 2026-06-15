import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cg_ambientes')
export class AmbienteCG {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'int', nullable: true })
  capacidad: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  area: string;
}
