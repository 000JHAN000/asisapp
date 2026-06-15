// domain/ports/persona.repository.port.ts

import { Persona } from '../entities/persona.entity';

export const PERSONA_REPOSITORY = 'PERSONA_REPOSITORY';

export interface PersonaRepositoryPort {
  crear(datos: Partial<Persona>): Promise<Persona>;
  listar(): Promise<Persona[]>;
  buscarPorId(id: string): Promise<Persona | null>;
  actualizar(id: string, datos: Partial<Persona>): Promise<void>;
  eliminar(id: string): Promise<void>;
}