import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoAsistencia } from '../../../domain/entities/asistencia.entity';

@Entity('asistencia_orm_entity')
export class AsistenciaTenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id_asistencia: string;

  @Column({ type: 'enum', enum: EstadoAsistencia })
  estado: EstadoAsistencia;

  @Column({ type: 'time' })
  hora: string;

  @Column({ type: 'varchar', length: 260, nullable: true })
  observaciones: string;

  @Column('uuid')
  formacion_fk: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  archivo_soporte: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  aprendizId: string;
}
