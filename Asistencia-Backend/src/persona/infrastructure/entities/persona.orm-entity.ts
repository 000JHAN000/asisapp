// infrastructure/entities/persona.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GeneroPersona, EstadoPersona } from '../../domain/entities/persona.entity';
import { MunicipioOrmEntity }  from 'src/municipio/infrastructure/entities/municipio.orm-entity';
import { MatriculaOrmEntity }  from 'src/matricula/infrastructure/entities/matricula.orm-entity';
import { UsuarioOrmEntity }    from 'src/usuario/infrastructure/entities/usuario.orm-entity';

@Entity()
export class PersonaOrmEntity {
    @PrimaryGeneratedColumn('uuid')
    id_persona: string;

    @Column({ type: 'int', unique: true })
    documento: number;

    @Column({ type: 'varchar', length: 50 })
    nombres: string;

    @Column({ type: 'varchar', length: 50 })
    direccion: string;

    @Column({ type: 'varchar', length: 15 })
    telefono: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    correo: string;

    @Column({ type: 'enum', enum: GeneroPersona })
    genero: GeneroPersona;

    @Column({ type: 'enum', enum: EstadoPersona, default: EstadoPersona.activo })
    estado: EstadoPersona;

    @Column('uuid')
    municipio_fk: string;

    @ManyToOne(() => MunicipioOrmEntity, (municipio) => municipio.personas)
    @JoinColumn({ name: 'municipio_fk' })
    municipio: MunicipioOrmEntity;

    @OneToMany(() => MatriculaOrmEntity, (matricula) => matricula.persona)
    matriculas: MatriculaOrmEntity[];

    @OneToMany(() => UsuarioOrmEntity, (usuario) => usuario.persona)
    usuarios: UsuarioOrmEntity[];
}