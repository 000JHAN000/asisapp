import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cg_ubicaciones')
export class Ubicacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 50 })
  tipo: string;
}
