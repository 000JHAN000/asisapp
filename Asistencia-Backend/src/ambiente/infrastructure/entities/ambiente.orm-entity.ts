// infrastructure/entities/ambiente.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AreaOrmEntity } from 'src/area/infrastructure/entities/area.orm-entity';

@Entity()
export class AmbienteOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_ambiente: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column('uuid')
  area_fk: string;

  @ManyToOne(() => AreaOrmEntity, (area) => area.ambientes)
  @JoinColumn({ name: 'area_fk' })
  area: AreaOrmEntity;
}