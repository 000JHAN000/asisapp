// infrastructure/entities/area.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SedeOrmEntity } from 'src/sede/infrastructure/entities/sede.orm-entity';
import { AmbienteOrmEntity } from 'src/ambiente/infrastructure/entities/ambiente.orm-entity';
import { CursoOrmEntity } from 'src/curso/infrastructure/entities/curso.orm-entity';

@Entity()
export class AreaOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_area: string;

  @Column({ type: 'varchar', length: 40 })
  nombre: string;

  @Column('uuid')
  sede_fk: string;

  @ManyToOne(() => SedeOrmEntity, (sede) => sede.areas)
  @JoinColumn({ name: 'sede_fk' })
  sede: SedeOrmEntity;

  @OneToMany(() => AmbienteOrmEntity, (ambiente) => ambiente.area)
  ambientes: AmbienteOrmEntity[];

  @OneToMany(() => CursoOrmEntity, (curso) => curso.area)
  cursos: CursoOrmEntity[];
}