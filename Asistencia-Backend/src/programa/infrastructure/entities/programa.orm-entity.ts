// infrastructure/entities/programa.orm-entity.ts

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CursoOrmEntity } from 'src/curso/infrastructure/entities/curso.orm-entity';

@Entity()
export class ProgramaOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_programa: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 50 })
  tipo_programa: string;

  @OneToMany(() => CursoOrmEntity, (curso) => curso.programa)
  cursos: CursoOrmEntity[];
}