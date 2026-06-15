// infrastructure/entities/departamento.orm-entity.ts

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MunicipioOrmEntity } from 'src/municipio/infrastructure/entities/municipio.orm-entity';

@Entity()
export class DepartamentoOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_departamento: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @OneToMany(() => MunicipioOrmEntity, (municipio) => municipio.departamento)
  municipio: MunicipioOrmEntity[];
}