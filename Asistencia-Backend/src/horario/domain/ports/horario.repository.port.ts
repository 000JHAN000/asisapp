import { Horario } from '../entities/horario.entity';

export const HORARIO_REPOSITORY = 'HORARIO_REPOSITORY';

export interface HorarioRepositoryPort {
    crear(datos: Partial<Horario>): Promise<Horario>;
    listar(): Promise<Horario[]>;
    buscarPorId(id: string): Promise<Horario | null>;
    actualizar(id: string, datos: Partial<Horario>): Promise<void>;
    eliminar(id: string): Promise<void>;
}