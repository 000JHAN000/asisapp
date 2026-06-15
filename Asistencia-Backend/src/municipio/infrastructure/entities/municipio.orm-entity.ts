// infrastructure/entities/municipio.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DepartamentoOrmEntity }    from 'src/departamento/infrastructure/entities/departamento.orm-entity';
import { CentroFormacionOrmEntity } from 'src/centro-formacion/infrastructure/entities/centro-formacion.orm-entity';
import { PersonaOrmEntity }         from 'src/persona/infrastructure/entities/persona.orm-entity';

@Entity()
export class MunicipioOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_municipio: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column('uuid')
  departamento_fk: string;

  @ManyToOne(() => DepartamentoOrmEntity, (departamento) => departamento.municipio)
  @JoinColumn({ name: 'departamento_fk' })
  departamento: DepartamentoOrmEntity;

  @OneToMany(() => CentroFormacionOrmEntity, (centro) => centro.municipio)
  centros: CentroFormacionOrmEntity[];

  @OneToMany(() => PersonaOrmEntity, (persona) => persona.municipio)
  personas: PersonaOrmEntity[];
}