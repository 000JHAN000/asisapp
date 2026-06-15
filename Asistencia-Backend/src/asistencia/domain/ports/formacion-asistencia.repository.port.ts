import { FormacionAsistencia } from '../entities/formacion-asistencia.entity';

export const FORMACION_ASISTENCIA_REPOSITORY = 'FORMACION_ASISTENCIA_REPOSITORY';

export interface FormacionAsistenciaRepositoryPort {
  crear(datos: Partial<FormacionAsistencia>): Promise<FormacionAsistencia>;
  listar(): Promise<FormacionAsistencia[]>;
  buscarPorId(id: string): Promise<FormacionAsistencia | null>;
  actualizar(id: string, datos: Partial<FormacionAsistencia>): Promise<void>;
  eliminar(id: string): Promise<void>;
}
