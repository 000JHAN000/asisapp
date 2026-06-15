// domain/ports/area.repository.port.ts

import { Area } from '../entities/area.entity';

export const AREA_REPOSITORY = 'AREA_REPOSITORY';

export interface AreaRepositoryPort {
  crear(datos: Partial<Area>): Promise<Area>;
  listar(): Promise<Area[]>;
  buscarPorId(id: string): Promise<Area | null>;
  actualizar(id: string, datos: Partial<Area>): Promise<void>;
  eliminar(id: string): Promise<void>;
}