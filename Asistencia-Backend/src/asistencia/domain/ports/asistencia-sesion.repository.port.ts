import { AsistenciaSesion } from '../entities/asistencia-sesion.entity';

export const ASISTENCIA_SESION_REPOSITORY = 'ASISTENCIA_SESION_REPOSITORY';

export interface AsistenciaSesionRepositoryPort {
  crear(datos: Partial<AsistenciaSesion>): Promise<AsistenciaSesion>;
  cerrarActivasDeInstructor(instructorId: string): Promise<void>;
  buscarPorId(id: string): Promise<AsistenciaSesion | null>;
  buscarActivaPorHorario(horarioId: string): Promise<AsistenciaSesion | null>;
  buscarActivasPorInstructor(instructorId: string): Promise<AsistenciaSesion[]>;
  buscarActivaPorHorarioIds(horarioIds: string[]): Promise<AsistenciaSesion | null>;
  guardar(sesion: AsistenciaSesion): Promise<AsistenciaSesion>;
  buscarPorFiltros(filtros: {
    fecha?: string;
    horarioIds?: string[];
    instructorId?: string;
  }): Promise<AsistenciaSesion[]>;
  buscarPorHorarioIdsYRangoFecha(
    horarioIds: string[],
    desde: string,
    hasta: string,
  ): Promise<AsistenciaSesion[]>;
}
