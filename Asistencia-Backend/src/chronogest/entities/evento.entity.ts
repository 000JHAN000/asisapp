import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type TipoEventoCG = 'festivo' | 'evaluacion' | 'actividad' | 'otro';

@Entity('cg_eventos')
export class Evento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'enum', enum: ['festivo','evaluacion','actividad','otro'] })
  tipo: TipoEventoCG;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date', nullable: true })
  fechaFin: Date;

  @Column({ type: 'time', nullable: true })
  horaInicio: string;

  @Column({ type: 'time', nullable: true })
  horaFin: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  lugar: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'json', nullable: true })
  fichas: string[];
}
