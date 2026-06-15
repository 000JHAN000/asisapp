// infrastructure/entities/aplicativo.orm-entity.ts

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ModuloOrmEntity }   from 'src/modulo/infrastructure/entities/modulo.orm-entity';
import { RolOrmEntity }      from 'src/rol/infrastructure/entities/rol.orm-entity';
import { UsuarioOrmEntity }  from 'src/usuario/infrastructure/entities/usuario.orm-entity';

@Entity()
export class AplicativoOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_aplicativo: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @OneToMany(() => ModuloOrmEntity, (modulo) => modulo.aplicativo)
  modulos: ModuloOrmEntity[];

  @OneToMany(() => RolOrmEntity, (rol) => rol.aplicativo)
  roles: RolOrmEntity[];

  @OneToMany(() => UsuarioOrmEntity, (usuario) => usuario.aplicativo)
  usuarios: UsuarioOrmEntity[];
}