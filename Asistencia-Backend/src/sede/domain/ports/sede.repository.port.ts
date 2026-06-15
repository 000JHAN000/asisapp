// domain/ports/sede.repository.port.ts

import { Sede } from '../entities/sede.entity';

export const SEDE_REPOSITORY = 'SEDE_REPOSITORY';

export interface SedeRepositoryPort {
  crear(datos: Partial<Sede>): Promise<Sede>;
  listar(): Promise<Sede[]>;
  buscarPorId(id: string): Promise<Sede | null>;
  actualizar(id: string, datos: Partial<Sede>): Promise<void>;
  eliminar(id: string): Promise<void>;
}