import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoFormacionAsistencia } from '../../domain/entities/formacion-asistencia.entity';
import { HorarioOrmEntity } from 'src/horario/infrastructure/entities/horario.orm-entity';
import { ConfiguracionAsistenciaOrmEntity } from './configuracion-asistencia.orm-entity';
import { AsistenciaOrmEntity } from './asistencia.orm-entity';

@Entity()
export class FormacionAsistenciaOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_formacion: string;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time' })
  hora_fin: string;

  @Column('uuid', { nullable: true })
  horario_fk: string;

  @Column('uuid', { nullable: true })
  configuracion_fk: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  cgHorarioId: string;

  @Column({
    type: 'enum',
    enum: EstadoFormacionAsistencia,
    default: EstadoFormacionAsistencia.abierta,
  })
  estado: EstadoFormacionAsistencia;

  @ManyToOne(() => HorarioOrmEntity, { nullable: true })
  @JoinColumn({ name: 'horario_fk' })
  horario: HorarioOrmEntity;

  @ManyToOne(() => ConfiguracionAsistenciaOrmEntity, { nullable: true })
  @JoinColumn({ name: 'configuracion_fk' })
  configuracion: ConfiguracionAsistenciaOrmEntity;

  @OneToMany(() => AsistenciaOrmEntity, (asistencia) => asistencia.formacion)
  asistencias: AsistenciaOrmEntity[];
}
