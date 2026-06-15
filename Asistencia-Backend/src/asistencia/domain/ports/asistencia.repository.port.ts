import { Asistencia } from '../entities/asistencia.entity';

export const ASISTENCIA_REPOSITORY = 'ASISTENCIA_REPOSITORY';

export interface AsistenciaRepositoryPort {
  crear(datos: Partial<Asistencia>): Promise<Asistencia>;
  listar(): Promise<Asistencia[]>;
  buscarPorId(id: string): Promise<Asistencia | null>;
  actualizar(id: string, datos: Partial<Asistencia>): Promise<void>;
  eliminar(id: string): Promise<void>;
}
