// infrastructure/entities/curso.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AreaOrmEntity }     from 'src/area/infrastructure/entities/area.orm-entity';
import { ProgramaOrmEntity } from 'src/programa/infrastructure/entities/programa.orm-entity';
import { MatriculaOrmEntity } from 'src/matricula/infrastructure/entities/matricula.orm-entity';

@Entity()
export class CursoOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_curso: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  codigo: string;

  @Column('date')
  fecha_inicio: Date;

  @Column('date')
  fecha_fin: Date;

  @Column('date')
  fin_lectiva: Date;

  @Column('uuid')
  area_fk: string;

  @Column('uuid')
  programa_fk: string;

  @Column({ type: 'varchar', length: 100 })
  lider: string;

  @ManyToOne(() => AreaOrmEntity, (area) => area.cursos)
  @JoinColumn({ name: 'area_fk' })
  area: AreaOrmEntity;

  @ManyToOne(() => ProgramaOrmEntity, (programa) => programa.cursos)
  @JoinColumn({ name: 'programa_fk' })
  programa: ProgramaOrmEntity;

  @OneToMany(() => MatriculaOrmEntity, (matricula) => matricula.curso)
  matriculas: MatriculaOrmEntity[];
}