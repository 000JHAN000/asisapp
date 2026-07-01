import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ubicacion_orm_entity')
export class UbicacionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_ubicacion: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 50 })
  tipo: string;
}
