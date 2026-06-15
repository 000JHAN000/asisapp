// domain/ports/aplicativo.repository.port.ts

import { Aplicativo } from '../entities/aplicativo.entity';

export const APLICATIVO_REPOSITORY = 'APLICATIVO_REPOSITORY';

export interface AplicativoRepositoryPort {
  crear(datos: Partial<Aplicativo>): Promise<Aplicativo>;
  listar(): Promise<Aplicativo[]>;
  buscarPorId(id: string): Promise<Aplicativo | null>;
  actualizar(id: string, datos: Partial<Aplicativo>): Promise<void>;
  eliminar(id: string): Promise<void>;
}