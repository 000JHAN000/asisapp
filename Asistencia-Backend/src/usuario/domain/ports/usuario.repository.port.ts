// domain/ports/usuario.repository.port.ts

import { Usuario } from '../entities/usuario.entity';

export const USUARIO_REPOSITORY = 'USUARIO_REPOSITORY';

export interface UsuarioRepositoryPort {
  crear(datos: Partial<Usuario>): Promise<Usuario>;
  listar(): Promise<Usuario[]>;
  listarPorAplicativo(aplicativoId: string): Promise<Usuario[]>;
  buscarPorId(id: string): Promise<Usuario | null>;
  actualizar(id: string, datos: Partial<Usuario>): Promise<void>;
  eliminar(id: string): Promise<void>;
}