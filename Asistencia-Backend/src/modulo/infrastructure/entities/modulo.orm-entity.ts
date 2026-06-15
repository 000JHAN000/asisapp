// infrastructure/entities/modulo.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AplicativoOrmEntity } from 'src/aplicativo/infrastructure/entities/aplicativo.orm-entity';
import { ServicioOrmEntity }   from 'src/servicio/infrastructure/entities/servicio.orm-entity';

@Entity()
export class ModuloOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_modulo: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column('uuid')
  aplicativo_fk: string;

  @ManyToOne(() => AplicativoOrmEntity, (aplicativo) => aplicativo.modulos)
  @JoinColumn({ name: 'aplicativo_fk' })
  aplicativo: AplicativoOrmEntity;

  @OneToMany(() => ServicioOrmEntity, (servicio) => servicio.modulo)
  servicios: ServicioOrmEntity[];
}