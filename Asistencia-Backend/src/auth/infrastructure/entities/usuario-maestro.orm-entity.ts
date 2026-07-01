import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type RolMaestro = 'super_admin' | 'admin' | 'instructor' | 'aprendiz';

@Entity({ schema: 'auth', name: 'usuario_maestro' })
export class UsuarioMaestro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  correo: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  documento: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 20 })
  rol: RolMaestro;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'persona_id' })
  personaId: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'tipo_doc' })
  tipoDoc: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  municipio: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'tenant_slug' })
  tenantSlug: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
