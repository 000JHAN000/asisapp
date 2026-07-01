import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InstructorOrmEntity } from 'src/persona/infrastructure/entities/instructor.orm-entity';
import { HorarioOrmEntity } from 'src/horario/infrastructure/entities/horario.orm-entity';

export type TipoSolicitud = 'cambio_horario' | 'cambio_ambiente' | 'cambio_jornada' | 'otro';
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';

@Entity('solicitud_cambio_orm_entity')
export class SolicitudCambioOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_solicitud: string;

  @Column('uuid')
  instructor_fk: string;

  @Column('uuid', { nullable: true })
  horario_fk: string | null;

  @Column({ type: 'enum', enum: ['cambio_horario','cambio_ambiente','cambio_jornada','otro'] })
  tipo: TipoSolicitud;

  @Column({ type: 'enum', enum: ['pendiente','aprobada','rechazada','cancelada'], default: 'pendiente' })
  estado: EstadoSolicitud;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'text', nullable: true })
  respuesta_admin: string | null;

  @CreateDateColumn()
  fecha_solicitud: Date;

  @ManyToOne(() => InstructorOrmEntity)
  @JoinColumn({ name: 'instructor_fk' })
  instructor: InstructorOrmEntity;

  @ManyToOne(() => HorarioOrmEntity, { nullable: true })
  @JoinColumn({ name: 'horario_fk' })
  horario: HorarioOrmEntity | null;
}
