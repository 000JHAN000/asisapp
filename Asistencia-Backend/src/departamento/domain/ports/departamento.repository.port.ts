// domain/ports/departamento.repository.port.ts

import { Departamento } from '../entities/departamento.entity';

export const DEPARTAMENTO_REPOSITORY = 'DEPARTAMENTO_REPOSITORY';

export interface DepartamentoRepositoryPort {
    crear(datos: Partial<Departamento>): Promise<Departamento>;
    listar(): Promise<Departamento[]>;
    buscarPorId(id: string): Promise<Departamento | null>;
    actualizar(id: string, datos: Partial<Departamento>): Promise<void>;
    eliminar(id: string): Promise<void>;
}