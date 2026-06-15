// infrastructure/entities/centro-formacion.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MunicipioOrmEntity } from 'src/municipio/infrastructure/entities/municipio.orm-entity';
import { SedeOrmEntity } from 'src/sede/infrastructure/entities/sede.orm-entity';

@Entity()
export class CentroFormacionOrmEntity {
    @PrimaryGeneratedColumn('uuid')
    id_centro: string;

    @Column({ type: 'varchar', length: 100 })
    nombre: string;

    @Column('uuid')
    municipio_fk: string;

    @ManyToOne(() => MunicipioOrmEntity, (municipio) => municipio.centros)
    @JoinColumn({ name: 'municipio_fk' })
    municipio: MunicipioOrmEntity;

    @OneToMany(() => SedeOrmEntity, (sede) => sede.centro)
    sedes: SedeOrmEntity[];
}