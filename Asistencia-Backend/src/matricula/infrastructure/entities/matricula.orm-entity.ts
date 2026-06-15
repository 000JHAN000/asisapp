// infrastructure/entities/matricula.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PersonaOrmEntity } from 'src/persona/infrastructure/entities/persona.orm-entity';
import { CursoOrmEntity }   from 'src/curso/infrastructure/entities/curso.orm-entity';

@Entity()
export class MatriculaOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_matricula: string;

  @Column('uuid')
  persona_fk: string;

  @Column('uuid')
  curso_fk: string;

  @ManyToOne(() => PersonaOrmEntity, (persona) => persona.matriculas)
  @JoinColumn({ name: 'persona_fk' })
  persona: PersonaOrmEntity;

  @ManyToOne(() => CursoOrmEntity, (curso) => curso.matriculas)
  @JoinColumn({ name: 'curso_fk' })
  curso: CursoOrmEntity;
}