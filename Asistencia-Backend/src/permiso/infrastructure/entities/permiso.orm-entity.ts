// infrastructure/entities/permiso.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioOrmEntity } from 'src/usuario/infrastructure/entities/usuario.orm-entity';
import { RolOrmEntity }     from 'src/rol/infrastructure/entities/rol.orm-entity';
import { ServicioOrmEntity } from 'src/servicio/infrastructure/entities/servicio.orm-entity';

@Entity()
export class PermisoOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_permiso: string;

  @Column('uuid')
  usuario_fk: string;

  @Column('uuid')
  rol_fk: string;

  @Column('uuid')
  servicio_fk: string;

  @ManyToOne(() => UsuarioOrmEntity, (usuario) => usuario.permisos)
  @JoinColumn({ name: 'usuario_fk' })
  usuario: UsuarioOrmEntity;

  @ManyToOne(() => RolOrmEntity, (rol) => rol.permisos)
  @JoinColumn({ name: 'rol_fk' })
  rol: RolOrmEntity;

  @ManyToOne(() => ServicioOrmEntity, (servicio) => servicio.permisos)
  @JoinColumn({ name: 'servicio_fk' })
  servicio: ServicioOrmEntity;
}