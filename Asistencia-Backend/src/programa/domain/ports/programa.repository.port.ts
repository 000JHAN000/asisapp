// domain/ports/programa.repository.port.ts

import { Programa } from '../entities/programa.entity';

export const PROGRAMA_REPOSITORY = 'PROGRAMA_REPOSITORY';

export interface ProgramaRepositoryPort {
    crear(datos: Partial<Programa>): Promise<Programa>;
    listar(): Promise<Programa[]>;
    buscarPorId(id: string): Promise<Programa | null>;
    actualizar(id: string, datos: Partial<Programa>): Promise<void>;
    eliminar(id: string): Promise<void>;
}