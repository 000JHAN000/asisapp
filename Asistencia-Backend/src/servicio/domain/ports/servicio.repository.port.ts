// domain/ports/servicio.repository.port.ts

import { Servicio } from '../entities/servicio.entity';

export const SERVICIO_REPOSITORY = 'SERVICIO_REPOSITORY';

export interface ServicioRepositoryPort {
  crear(datos: Partial<Servicio>): Promise<Servicio>;
  listar(): Promise<Servicio[]>;
  buscarPorId(id: string): Promise<Servicio | null>;
  actualizar(id: string, datos: Partial<Servicio>): Promise<void>;
  eliminar(id: string): Promise<void>;
}