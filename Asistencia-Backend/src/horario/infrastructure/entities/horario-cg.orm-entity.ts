import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type DiaSemanaCG = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
export type JornadaCG = 'manana' | 'tarde' | 'noche';
export type EstadoHorarioCG = 'programado' | 'activo' | 'finalizado' | 'cancelado';

@Entity('cg_horarios')
export class HorarioCG {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'] })
  diaSemana: DiaSemanaCG;

  @Column({ type: 'enum', enum: ['manana','tarde','noche'], nullable: true })
  jornada: JornadaCG;

  @Column({ type: 'time' })
  horaInicio: string;

  @Column({ type: 'time' })
  horaFin: string;

  @Column({ type: 'varchar', length: 36 })
  fichaId: string;

  @Column({ type: 'varchar', length: 36 })
  instructorId: string;

  @Column({ type: 'varchar', length: 36 })
  ambienteId: string;

  @Column({ type: 'boolean', default: false })
  activo: boolean;

  @Column({ type: 'enum', enum: ['programado','activo','finalizado','cancelado'], default: 'programado' })
  estado: EstadoHorarioCG;

  @Column({ type: 'int', default: 0 })
  minutosRetraso: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ubicacionTransversalNombre: string;
}
