import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { HorarioOrmEntity } from 'src/horario/infrastructure/entities/horario.orm-entity';

@Entity('competencia_orm_entity')
export class CompetenciaOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_competencia: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  resultado: string | null;

  @Column({ type: 'int', nullable: true })
  horas_requeridas: number | null;

  @Column('uuid')
  horario_fk: string;

  @Column({ type: 'date', nullable: true })
  fecha_inicio: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_fin: Date | null;

  @Column({ type: 'json', nullable: true })
  dias_clase: string[] | null;

  @ManyToOne(() => HorarioOrmEntity)
  @JoinColumn({ name: 'horario_fk' })
  horario: HorarioOrmEntity;
}
