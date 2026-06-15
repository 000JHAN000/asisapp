// domain/ports/permiso.repository.port.ts

import { Permiso } from '../entities/permiso.entity';

export const PERMISO_REPOSITORY = 'PERMISO_REPOSITORY';

export interface PermisoRepositoryPort {
  crear(datos: Partial<Permiso>): Promise<Permiso>;
  listar(): Promise<Permiso[]>;
  buscarPorId(id: string): Promise<Permiso | null>;
  actualizar(id: string, datos: Partial<Permiso>): Promise<void>;
  eliminar(id: string): Promise<void>;
}