// infrastructure/entities/sede.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CentroFormacionOrmEntity } from 'src/centro-formacion/infrastructure/entities/centro-formacion.orm-entity';
import { AreaOrmEntity } from 'src/area/infrastructure/entities/area.orm-entity';

@Entity()
export class SedeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_sede: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column('uuid')
  centro_formacion_fk: string;

  @ManyToOne(() => CentroFormacionOrmEntity, (centro) => centro.sedes)
  @JoinColumn({ name: 'centro_formacion_fk' })
  centro: CentroFormacionOrmEntity;

  @OneToMany(() => AreaOrmEntity, (area) => area.sede)
  areas: AreaOrmEntity[];
}