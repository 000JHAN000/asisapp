import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MatriculaOrmEntity } from 'src/matricula/infrastructure/entities/matricula.orm-entity';

@Entity()
export class ConfiguracionAsistenciaOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_configuracion: string;

  @Column({ type: 'boolean', default: false })
  firma: boolean;

  @Column({ type: 'boolean', default: false })
  foto: boolean;

  @Column('uuid')
  matricula_fk: string;

  @ManyToOne(() => MatriculaOrmEntity)
  @JoinColumn({ name: 'matricula_fk' })
  matricula: MatriculaOrmEntity;
}
