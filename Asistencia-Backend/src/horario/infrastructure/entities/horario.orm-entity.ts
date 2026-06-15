import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CursoOrmEntity }    from 'src/curso/infrastructure/entities/curso.orm-entity';
import { AmbienteOrmEntity } from 'src/ambiente/infrastructure/entities/ambiente.orm-entity';

@Entity()
export class HorarioOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_horario: string;

  @Column('uuid')
  curso_fk: string;

  @Column('uuid')
  ambiente_fk: string;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time' })
  hora_fin: string;

  @ManyToOne(() => CursoOrmEntity)
  @JoinColumn({ name: 'curso_fk' })
  curso: CursoOrmEntity;

  @ManyToOne(() => AmbienteOrmEntity)
  @JoinColumn({ name: 'ambiente_fk' })
  ambiente: AmbienteOrmEntity;
}
