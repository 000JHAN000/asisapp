import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cg_configuracion')
export class ConfiguracionApp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, default: '1234' })
  pinRegistro: string;
}
