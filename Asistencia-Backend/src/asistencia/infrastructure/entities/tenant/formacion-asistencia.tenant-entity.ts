import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoFormacionAsistencia } from '../../../domain/entities/formacion-asistencia.entity';

@Entity('formacion_asistencia_orm_entity')
export class FormacionAsistenciaTenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id_formacion: string;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time' })
  hora_fin: string;

  @Column('uuid', { nullable: true })
  horario_fk: string;

  @Column('uuid', { nullable: true })
  configuracion_fk: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  cgHorarioId: string;

  @Column({
    type: 'enum',
    enum: EstadoFormacionAsistencia,
    default: EstadoFormacionAsistencia.abierta,
  })
  estado: EstadoFormacionAsistencia;
}
