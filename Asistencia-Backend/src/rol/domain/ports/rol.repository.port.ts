// domain/ports/rol.repository.port.ts

import { Rol } from '../entities/rol.entity';

export const ROL_REPOSITORY = 'ROL_REPOSITORY';

export interface RolRepositoryPort {
  crear(datos: Partial<Rol>): Promise<Rol>;
  listar(): Promise<Rol[]>;
  listarPorAplicativo(aplicativoId: string): Promise<Rol[]>; 
  buscarPorId(id: string): Promise<Rol | null>;
  actualizar(id: string, datos: Partial<Rol>): Promise<void>;
  eliminar(id: string): Promise<void>;
}