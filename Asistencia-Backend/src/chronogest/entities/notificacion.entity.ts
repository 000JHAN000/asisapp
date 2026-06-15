import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cg_notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  destinatarioId: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  destinatarioRol: string;

  @Column({ type: 'boolean', default: false })
  leida: boolean;

  @CreateDateColumn()
  fecha: Date;
}
