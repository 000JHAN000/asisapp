// domain/ports/credencial.repository.port.ts

import { Credencial } from '../entities/credencial.entity';

export const CREDENCIAL_REPOSITORY = 'CREDENCIAL_REPOSITORY';

export interface CredencialRepositoryPort {
  crear(datos: Partial<Credencial>): Promise<Credencial>;
  listar(): Promise<Credencial[]>;
  buscarPorId(id: string): Promise<Credencial | null>;
  actualizar(id: string, datos: Partial<Credencial>): Promise<void>;
  eliminar(id: string): Promise<void>;
}