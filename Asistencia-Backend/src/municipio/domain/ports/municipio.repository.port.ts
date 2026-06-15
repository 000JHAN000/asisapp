// domain/ports/municipio.repository.port.ts

import { Municipio } from '../entities/municipio.entity';

export const MUNICIPIO_REPOSITORY = 'MUNICIPIO_REPOSITORY';

export interface MunicipioRepositoryPort {
    crear(datos: Partial<Municipio>): Promise<Municipio>;
    listar(): Promise<Municipio[]>;
    buscarPorId(id: string): Promise<Municipio | null>;
    actualizar(id: string, datos: Partial<Municipio>): Promise<void>;
    eliminar(id: string): Promise<void>;
}