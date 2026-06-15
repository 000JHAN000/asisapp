import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type EstadoRegistro = 'presente' | 'falla_justificada';

@Entity('asistencia_registros')
export class AsistenciaRegistroOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  sesionId: string;

  @Column({ type: 'varchar', length: 36 })
  aprendizId: string;

  @Column({ type: 'enum', enum: ['presente', 'falla_justificada'], default: 'presente' })
  estado: EstadoRegistro;

  @CreateDateColumn()
  horaRegistro: Date;

  @Column({ type: 'text', nullable: true })
  firmaImagen?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  facePhotoPath?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitud?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitud?: number;

  @Column({ type: 'text', nullable: true })
  nota?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  soporteUrl?: string;
}
