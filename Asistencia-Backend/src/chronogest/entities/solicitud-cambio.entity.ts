import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type TipoSolicitudCG = 'cambio_horario' | 'cambio_ambiente' | 'cambio_jornada' | 'otro';
export type EstadoSolicitudCG = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';

@Entity('cg_solicitudes_cambio')
export class SolicitudCambio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  instructorId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  horarioId: string;

  @Column({ type: 'enum', enum: ['cambio_horario','cambio_ambiente','cambio_jornada','otro'] })
  tipo: TipoSolicitudCG;

  @Column({ type: 'enum', enum: ['pendiente','aprobada','rechazada','cancelada'], default: 'pendiente' })
  estado: EstadoSolicitudCG;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'text', nullable: true })
  respuestaAdmin: string;

  @CreateDateColumn()
  fechaSolicitud: Date;
}
