// infrastructure/entities/credencial.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RolOrmEntity }     from 'src/rol/infrastructure/entities/rol.orm-entity';
import { UsuarioOrmEntity } from 'src/usuario/infrastructure/entities/usuario.orm-entity';

@Entity()
export class CredencialOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_credencial: string;

  @Column({ type: 'varchar', length: 50 })
  login: string;

  @Column({ type: 'varchar', length: 100 })
  password: string;

  @Column('uuid')
  rol_fk: string;

  @Column('uuid')
  usuario_fk: string;

  @ManyToOne(() => RolOrmEntity, (rol) => rol.credenciales)
  @JoinColumn({ name: 'rol_fk' })
  rol: RolOrmEntity;

  @ManyToOne(() => UsuarioOrmEntity, (usuario) => usuario.credenciales)
  @JoinColumn({ name: 'usuario_fk' })
  usuario: UsuarioOrmEntity;
}