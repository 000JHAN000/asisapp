import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cg_administradores')
export class AdminCG {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellido: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  correo: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  documento: string;
}
