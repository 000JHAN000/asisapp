import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cg_competencias')
export class Competencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  resultado: string;

  @Column({ type: 'int', nullable: true })
  horasRequeridas: number;

  @Column({ type: 'varchar', length: 36 })
  horarioId: string;

  @Column({ type: 'date', nullable: true })
  fechaInicio: Date;

  @Column({ type: 'date', nullable: true })
  fechaFin: Date;

  @Column({ type: 'json', nullable: true })
  diasClase: string[];
}
