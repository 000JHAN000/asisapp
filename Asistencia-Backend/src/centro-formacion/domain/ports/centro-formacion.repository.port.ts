// domain/ports/centro-formacion.repository.port.ts

import { CentroFormacion } from '../entities/centro-formacion.entity';

export const CENTRO_FORMACION_REPOSITORY = 'CENTRO_FORMACION_REPOSITORY';

export interface CentroFormacionRepositoryPort {
    crear(datos: Partial<CentroFormacion>): Promise<CentroFormacion>;
    listar(): Promise<CentroFormacion[]>;
    buscarPorId(id: string): Promise<CentroFormacion | null>;
    actualizar(id: string, datos: Partial<CentroFormacion>): Promise<void>;
    eliminar(id: string): Promise<void>;
}