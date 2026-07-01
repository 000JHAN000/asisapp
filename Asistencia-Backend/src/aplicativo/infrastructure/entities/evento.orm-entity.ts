import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type TipoEvento = 'festivo' | 'evaluacion' | 'actividad' | 'otro';

@Entity('evento_orm_entity')
export class EventoOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_evento: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'enum', enum: ['festivo','evaluacion','actividad','otro'] })
  tipo: TipoEvento;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date', nullable: true })
  fecha_fin: Date | null;

  @Column({ type: 'time', nullable: true })
  hora_inicio: string | null;

  @Column({ type: 'time', nullable: true })
  hora_fin: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  lugar: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'json', nullable: true })
  fichas: string[] | null;
}
