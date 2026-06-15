import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cg_aprendices')
export class AprendizCG {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellido: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  correo: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  documento: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  fichaId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  facePhotoPath: string;

  @Column({ type: 'text', nullable: true })
  faceEmbedding: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastAttendancePhotoPath: string;
}
