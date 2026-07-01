import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PersonaOrmEntity } from 'src/persona/infrastructure/entities/persona.orm-entity';

@Entity('notificacion_orm_entity')
export class NotificacionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_notificacion: string;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column('uuid', { nullable: true })
  destinatario_fk: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  destinatario_rol: string | null;

  @Column({ type: 'boolean', default: false })
  leida: boolean;

  @CreateDateColumn()
  fecha: Date;

  @ManyToOne(() => PersonaOrmEntity, { nullable: true })
  @JoinColumn({ name: 'destinatario_fk' })
  destinatario: PersonaOrmEntity | null;
}
