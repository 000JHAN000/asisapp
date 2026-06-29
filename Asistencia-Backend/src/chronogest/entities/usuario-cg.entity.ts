import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type RolCG = 'super_admin' | 'admin' | 'instructor' | 'aprendiz';

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

  @Column({ type: 'varchar', length: 20 })
  rol: RolCG;

  @Column({ type: 'varchar', length: 36, nullable: true })
  personaId: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'tenant_slug' })
  tenantSlug: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
