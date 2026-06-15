// infrastructure/entities/acceso.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoAcceso } from '../../domain/entities/acceso.entity';
import { UsuarioOrmEntity } from 'src/usuario/infrastructure/entities/usuario.orm-entity';

@Entity()
export class AccesoOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_acceso: string;

  @Column({ type: 'varchar', length: 555 })
  token: string;

  @Column('uuid')
  usuario_fk: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_ingreso: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_salida: Date;

  @Column({
    type: 'enum',
    enum: EstadoAcceso,
    default: EstadoAcceso.activo,
  })
  estado: EstadoAcceso;

  @ManyToOne(() => UsuarioOrmEntity, (usuario) => usuario.accesos)
  @JoinColumn({ name: 'usuario_fk' })
  usuario: UsuarioOrmEntity;
}