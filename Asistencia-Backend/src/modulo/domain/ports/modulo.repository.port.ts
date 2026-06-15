// domain/ports/modulo.repository.port.ts

import { Modulo } from '../entities/modulo.entity';

export const MODULO_REPOSITORY = 'MODULO_REPOSITORY';

export interface ModuloRepositoryPort {
  crear(datos: Partial<Modulo>): Promise<Modulo>;
  listar(): Promise<Modulo[]>;
  listarPorAplicativo(aplicativoId: string): Promise<Modulo[]>;
  buscarPorId(id: string): Promise<Modulo | null>;
  actualizar(id: string, datos: Partial<Modulo>): Promise<void>;
  eliminar(id: string): Promise<void>;
}