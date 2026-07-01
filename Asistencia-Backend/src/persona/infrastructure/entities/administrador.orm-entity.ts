import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PersonaOrmEntity } from './persona.orm-entity';

@Entity()
export class AdministradorOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id_administrador: string;

  @Column('uuid', { unique: true })
  persona_fk: string;

  @OneToOne(() => PersonaOrmEntity)
  @JoinColumn({ name: 'persona_fk' })
  persona: PersonaOrmEntity;
}
