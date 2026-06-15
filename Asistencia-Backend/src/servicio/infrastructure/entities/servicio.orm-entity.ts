// infrastructure/entities/servicio.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ModuloOrmEntity }  from 'src/modulo/infrastructure/entities/modulo.orm-entity';
import { PermisoOrmEntity } from 'src/permiso/infrastructure/entities/permiso.orm-entity';

@Entity()
export class ServicioOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_servicio: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  url: string;

  @Column('uuid')
  modulo_fk: string;

  @ManyToOne(() => ModuloOrmEntity, (modulo) => modulo.servicios)
  @JoinColumn({ name: 'modulo_fk' })
  modulo: ModuloOrmEntity;

  @OneToMany(() => PermisoOrmEntity, (permiso) => permiso.servicio)
  permisos: PermisoOrmEntity[];
}