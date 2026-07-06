import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CursoOrmEntity }    from 'src/curso/infrastructure/entities/curso.orm-entity';
import { AmbienteOrmEntity } from 'src/ambiente/infrastructure/entities/ambiente.orm-entity';
import { InstructorOrmEntity } from 'src/persona/infrastructure/entities/instructor.orm-entity';

export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
export type Jornada = 'manana' | 'tarde' | 'noche';
export type EstadoHorario = 'programado' | 'activo' | 'finalizado' | 'cancelado';

@Entity()
export class HorarioOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_horario: string;

  @Column('uuid')
  curso_fk: string;

  @Column('uuid')
  ambiente_fk: string;

  @Column('uuid', { nullable: true })
  instructor_fk: string | null;

  @Column({ type: 'date', nullable: true })
  fecha: Date | null;

  @Column({ type: 'enum', enum: ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'], nullable: true })
  diaSemana: DiaSemana | null;

  @Column({ type: 'enum', enum: ['manana','tarde','noche'], nullable: true })
  jornada: Jornada | null;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time' })
  hora_fin: string;

  @Column({ type: 'boolean', default: false })
  activo: boolean;

  @Column({ type: 'enum', enum: ['programado','activo','finalizado','cancelado'], default: 'programado' })
  estado: EstadoHorario;

  @Column({ type: 'int', default: 0 })
  minutos_retraso: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ubicacion_transversal_nombre: string | null;

  @ManyToOne(() => CursoOrmEntity)
  @JoinColumn({ name: 'curso_fk' })
  curso: CursoOrmEntity;

  @ManyToOne(() => AmbienteOrmEntity)
  @JoinColumn({ name: 'ambiente_fk' })
  ambiente: AmbienteOrmEntity;

  @ManyToOne(() => InstructorOrmEntity, { nullable: true })
  @JoinColumn({ name: 'instructor_fk' })
  instructor: InstructorOrmEntity | null;
}
