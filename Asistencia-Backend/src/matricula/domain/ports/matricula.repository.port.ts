// domain/ports/matricula.repository.port.ts

import { Matricula } from '../entities/matricula.entity';

export const MATRICULA_REPOSITORY = 'MATRICULA_REPOSITORY';

export interface MatriculaRepositoryPort {
  crear(datos: Partial<Matricula>): Promise<Matricula>;
  listar(cursoFk?: string): Promise<Matricula[]>;  // ← agregar parámetro opcional
  buscarPorId(id: string): Promise<Matricula | null>;
  actualizar(id: string, datos: Partial<Matricula>): Promise<void>;
  eliminar(id: string): Promise<void>;
}