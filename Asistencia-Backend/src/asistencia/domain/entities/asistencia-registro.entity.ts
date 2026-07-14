export type EstadoRegistro = 'presente' | 'falla_justificada' | 'justificacion_pendiente' | 'falla_injustificada';

export class AsistenciaRegistro {
  id: string;
  sesionId: string;
  aprendizId: string;
  estado: EstadoRegistro;
  horaRegistro: Date;
  firmaImagen?: string;
  facePhotoPath?: string;
  ipAddress?: string;
  latitud?: number;
  longitud?: number;
  nota?: string;
  soporteUrl?: string;
}
