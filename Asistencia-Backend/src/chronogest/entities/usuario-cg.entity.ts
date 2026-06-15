import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type RolCG = 'admin' | 'instructor' | 'aprendiz';

@Entity('cg_usuarios')
export class UsuarioCG {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  correo: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  documento: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'enum', enum: ['admin', 'instructor', 'aprendiz'] })
  rol: RolCG;

  @Column({ type: 'varchar', length: 36, nullable: true })
  personaId: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
