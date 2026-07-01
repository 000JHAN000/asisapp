// infrastructure/entities/ambiente.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AreaOrmEntity } from 'src/area/infrastructure/entities/area.orm-entity';

@Entity()
export class AmbienteOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_ambiente: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'int', nullable: true })
  capacidad: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo: string | null;

  @Column('uuid')
  area_fk: string;

  @ManyToOne(() => AreaOrmEntity, (area) => area.ambientes)
  @JoinColumn({ name: 'area_fk' })
  area: AreaOrmEntity;
}