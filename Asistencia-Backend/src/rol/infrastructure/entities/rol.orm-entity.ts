// infrastructure/entities/rol.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AplicativoOrmEntity }  from 'src/aplicativo/infrastructure/entities/aplicativo.orm-entity';
import { CredencialOrmEntity }  from 'src/credencial/infrastructure/entities/credencial.orm-entity';
import { PermisoOrmEntity }     from 'src/permiso/infrastructure/entities/permiso.orm-entity';

@Entity()
export class RolOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_rol: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column('uuid')
  aplicativo_fk: string;

  @ManyToOne(() => AplicativoOrmEntity, (aplicativo) => aplicativo.roles)
  @JoinColumn({ name: 'aplicativo_fk' })
  aplicativo: AplicativoOrmEntity;

  @OneToMany(() => CredencialOrmEntity, (credencial) => credencial.rol)
  credenciales: CredencialOrmEntity[];

  @OneToMany(() => PermisoOrmEntity, (permiso) => permiso.rol)
  permisos: PermisoOrmEntity[];
}