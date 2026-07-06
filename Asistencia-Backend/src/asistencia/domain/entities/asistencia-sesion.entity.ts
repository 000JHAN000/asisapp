export type EstadoSesion = 'activa' | 'cerrada' | 'cancelada';

export class AsistenciaSesion {
  id: string;
  horarioId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoSesion;
  instructorId: string;
  createdAt: Date;
}
