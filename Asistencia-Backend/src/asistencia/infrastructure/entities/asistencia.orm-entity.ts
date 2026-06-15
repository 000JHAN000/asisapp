import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoAsistencia } from '../../domain/entities/asistencia.entity';
import { FormacionAsistenciaOrmEntity } from './formacion-asistencia.orm-entity';

@Entity()
export class AsistenciaOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_asistencia: string;

  @Column({ type: 'enum', enum: EstadoAsistencia })
  estado: EstadoAsistencia;

  @Column({ type: 'time' })
  hora: string;

  @Column({ type: 'varchar', length: 260, nullable: true })
  observaciones: string;

  @Column('uuid')
  formacion_fk: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  archivo_soporte: string;

  @ManyToOne(() => FormacionAsistenciaOrmEntity, (formacion) => formacion.asistencias)
  @JoinColumn({ name: 'formacion_fk' })
  formacion: FormacionAsistenciaOrmEntity;
}
