import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PersonaOrmEntity } from '../../../../persona/infrastructure/entities/persona.orm-entity';

export type EstadoRegistro = 'presente' | 'falla_justificada' | 'justificacion_pendiente' | 'falla_injustificada';

@Entity('asistencia_registros')
export class AsistenciaRegistroTenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  sesionId: string;

  @Column({ type: 'uuid' })
  aprendizId: string;

  @ManyToOne(() => PersonaOrmEntity)
  @JoinColumn({ name: 'aprendizId' })
  aprendiz: PersonaOrmEntity;

  @Column({ type: 'enum', enum: ['presente', 'falla_justificada', 'justificacion_pendiente', 'falla_injustificada'], default: 'presente' })
  estado: EstadoRegistro;

  @Column({ type: 'timestamp' })
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
