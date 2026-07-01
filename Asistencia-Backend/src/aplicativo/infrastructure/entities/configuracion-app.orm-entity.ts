import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('configuracion_app_orm_entity')
export class ConfiguracionAppOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_configuracion_app: string;

  @Column({ type: 'varchar', length: 10, default: '1234' })
  pin_registro: string;
}
