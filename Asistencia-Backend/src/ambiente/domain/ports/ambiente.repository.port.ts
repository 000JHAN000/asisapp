// domain/ports/ambiente.repository.port.ts

import { Ambiente } from '../entities/ambiente.entity';

export const AMBIENTE_REPOSITORY = 'AMBIENTE_REPOSITORY';

export interface AmbienteRepositoryPort {
  crear(datos: Partial<Ambiente>): Promise<Ambiente>;
  listar(): Promise<Ambiente[]>;
  buscarPorId(id: string): Promise<Ambiente | null>;
  actualizar(id: string, datos: Partial<Ambiente>): Promise<void>;
  eliminar(id: string): Promise<void>;
}