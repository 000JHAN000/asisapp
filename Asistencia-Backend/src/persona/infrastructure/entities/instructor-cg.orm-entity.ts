import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cg_instructores')
export class InstructorCG {
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

  @Column({ type: 'boolean', default: false })
  esLider: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  areaLiderada: string;

  @Column({ type: 'boolean', default: false })
  esTransversal: boolean;
}
