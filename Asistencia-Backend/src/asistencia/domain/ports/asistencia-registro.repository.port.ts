import { AsistenciaRegistro } from '../entities/asistencia-registro.entity';

export const ASISTENCIA_REGISTRO_REPOSITORY = 'ASISTENCIA_REGISTRO_REPOSITORY';

export interface AsistenciaRegistroRepositoryPort {
  buscarPorSesion(sesionId: string): Promise<AsistenciaRegistro[]>;
  buscarPorSesiones(sesionIds: string[]): Promise<AsistenciaRegistro[]>;
  buscarUno(sesionId: string, aprendizId?: string): Promise<AsistenciaRegistro | null>;
  crear(datos: Partial<AsistenciaRegistro>): Promise<AsistenciaRegistro>;
  guardar(registro: AsistenciaRegistro): Promise<AsistenciaRegistro>;
}
