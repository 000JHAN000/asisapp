// infrastructure/entities/usuario.orm-entity.ts

import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PersonaOrmEntity }    from 'src/persona/infrastructure/entities/persona.orm-entity';
import { AplicativoOrmEntity } from 'src/aplicativo/infrastructure/entities/aplicativo.orm-entity';
import { AccesoOrmEntity }     from 'src/acceso/infrastructure/entities/acceso.orm-entity';
import { CredencialOrmEntity } from 'src/credencial/infrastructure/entities/credencial.orm-entity';
import { PermisoOrmEntity }    from 'src/permiso/infrastructure/entities/permiso.orm-entity';

@Entity()
export class UsuarioOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_usuario: string;

  @Column('uuid')
  persona_fk: string;

  @Column('uuid')
  aplicativo_fk: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  tenant_slug: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToOne(() => PersonaOrmEntity, (persona) => persona.usuarios)
  @JoinColumn({ name: 'persona_fk' })
  persona: PersonaOrmEntity;

  @ManyToOne(() => AplicativoOrmEntity, (aplicativo) => aplicativo.usuarios)
  @JoinColumn({ name: 'aplicativo_fk' })
  aplicativo: AplicativoOrmEntity;

  @OneToMany(() => AccesoOrmEntity, (acceso) => acceso.usuario)
  accesos: AccesoOrmEntity[];

  @OneToMany(() => CredencialOrmEntity, (credencial) => credencial.usuario)
  credenciales: CredencialOrmEntity[];

  @OneToMany(() => PermisoOrmEntity, (permiso) => permiso.usuario)
  permisos: PermisoOrmEntity[];
}