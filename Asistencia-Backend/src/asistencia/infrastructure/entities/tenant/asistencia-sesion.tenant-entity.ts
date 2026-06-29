import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type EstadoSesion = 'activa' | 'cerrada' | 'cancelada';

@Entity('asistencia_sesiones')
export class AsistenciaSesionTenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  horarioId: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'time' })
  horaInicio: string;

  @Column({ type: 'time' })
  horaFin: string;

  @Column({ type: 'enum', enum: ['activa', 'cerrada', 'cancelada'], default: 'activa' })
  estado: EstadoSesion;

  @Column({ type: 'varchar', length: 36 })
  instructorId: string;

  @Column('uuid', { nullable: true })
  formacionAsistenciaId: string;

  @CreateDateColumn()
  createdAt: Date;
}
