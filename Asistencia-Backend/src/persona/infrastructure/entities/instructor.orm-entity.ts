// infrastructure/entities/instructor.orm-entity.ts

import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PersonaOrmEntity } from './persona.orm-entity';

@Entity()
export class InstructorOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_instructor: string;

  @Column('uuid', { unique: true })
  persona_fk: string;

  @OneToOne(() => PersonaOrmEntity)
  @JoinColumn({ name: 'persona_fk' })
  persona: PersonaOrmEntity;

  @Column({ name: 'es_lider', type: 'boolean', default: false })
  esLider: boolean;

  @Column({ name: 'area_liderada', type: 'varchar', length: 100, nullable: true })
  areaLiderada: string | null;

  @Column({ name: 'es_transversal', type: 'boolean', default: false })
  esTransversal: boolean;
}
