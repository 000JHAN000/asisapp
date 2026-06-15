import { ConfiguracionAsistencia } from '../entities/configuracion-asistencia.entity';

export const CONFIGURACION_ASISTENCIA_REPOSITORY = 'CONFIGURACION_ASISTENCIA_REPOSITORY';

export interface ConfiguracionAsistenciaRepositoryPort {
  crear(datos: Partial<ConfiguracionAsistencia>): Promise<ConfiguracionAsistencia>;
  listar(): Promise<ConfiguracionAsistencia[]>;
  buscarPorId(id: string): Promise<ConfiguracionAsistencia | null>;
  actualizar(id: string, datos: Partial<ConfiguracionAsistencia>): Promise<void>;
  eliminar(id: string): Promise<void>;
}
