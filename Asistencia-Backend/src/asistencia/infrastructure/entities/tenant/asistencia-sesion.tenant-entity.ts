import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HorarioOrmEntity } from '../../../../horario/infrastructure/entities/horario.orm-entity';
import { InstructorOrmEntity } from '../../../../persona/infrastructure/entities/instructor.orm-entity';

export type EstadoSesion = 'activa' | 'cerrada' | 'cancelada';

@Entity('asistencia_sesiones')
export class AsistenciaSesionTenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  horarioId: string;

  @ManyToOne(() => HorarioOrmEntity)
  @JoinColumn({ name: 'horarioId' })
  horario: HorarioOrmEntity;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'time' })
  horaInicio: string;

  @Column({ type: 'time' })
  horaFin: string;

  @Column({ type: 'enum', enum: ['activa', 'cerrada', 'cancelada'], default: 'activa' })
  estado: EstadoSesion;

  @Column({ type: 'uuid' })
  instructorId: string;

  @ManyToOne(() => InstructorOrmEntity)
  @JoinColumn({ name: 'instructorId' })
  instructor: InstructorOrmEntity;

  @CreateDateColumn()
  createdAt: Date;
}
