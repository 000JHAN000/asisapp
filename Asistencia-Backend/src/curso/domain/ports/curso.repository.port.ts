// domain/ports/curso.repository.port.ts

import { Curso } from '../entities/curso.entity';

export const CURSO_REPOSITORY = 'CURSO_REPOSITORY';

export interface CursoRepositoryPort {
  crear(datos: Partial<Curso>): Promise<Curso>;
  listar(): Promise<Curso[]>;
  buscarPorId(id: string): Promise<Curso | null>;
  actualizar(id: string, datos: Partial<Curso>): Promise<void>;
  eliminar(id: string): Promise<void>;
}