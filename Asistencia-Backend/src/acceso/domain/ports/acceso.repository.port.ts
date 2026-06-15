// domain/ports/acceso.repository.port.ts

import { Acceso } from '../entities/acceso.entity';

export const ACCESO_REPOSITORY = 'ACCESO_REPOSITORY';

export interface AccesoRepositoryPort {
  crear(datos: Partial<Acceso>): Promise<Acceso>;
  listar(): Promise<Acceso[]>;
  buscarPorId(id: string): Promise<Acceso | null>;
  actualizar(id: string, datos: Partial<Acceso>): Promise<void>;
  eliminar(id: string): Promise<void>;
}