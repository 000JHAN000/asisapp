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

    @Column({ type: 'varchar', length: 20, unique: true })
    documento: string;

    @Column({ type: 'varchar', length: 50 })
    nombres: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    apellidos: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    direccion: string | null;

    @Column({ type: 'varchar', length: 15, nullable: true })
    telefono: string | null;

    @Column({ type: 'varchar', length: 100, unique: true })
    correo: string;

    @Column({ type: 'enum', enum: GeneroPersona, nullable: true })
    genero: GeneroPersona | null;

    @Column({ type: 'enum', enum: EstadoPersona, default: EstadoPersona.activo })
    estado: EstadoPersona;

    @Column({ name: 'tipo_doc', type: 'varchar', length: 10, nullable: true })
    tipo_doc: string | null;

    @Column({ name: 'municipio_nombre', type: 'varchar', length: 100, nullable: true })
    municipio_nombre: string | null;

    @Column('uuid', { nullable: true })
    municipio_fk: string | null;

    @Column({ name: 'face_photo_path', type: 'varchar', length: 500, nullable: true })
    facePhotoPath: string | null;

    @Column({ name: 'face_embedding', type: 'text', nullable: true })
    faceEmbedding: string | null;

    @Column({ name: 'last_attendance_photo_path', type: 'varchar', length: 500, nullable: true })
    lastAttendancePhotoPath: string | null;

    @ManyToOne(() => MunicipioOrmEntity, (municipio) => municipio.personas, { nullable: true })
    @JoinColumn({ name: 'municipio_fk' })
    municipio: MunicipioOrmEntity | null;

    @OneToMany(() => MatriculaOrmEntity, (matricula) => matricula.persona)
    matriculas: MatriculaOrmEntity[];

    @OneToMany(() => UsuarioOrmEntity, (usuario) => usuario.persona)
    usuarios: UsuarioOrmEntity[];
}