export enum EstadoAsistencia {
  asistio = 'asistio',
  falla   = 'falla',
  tarde   = 'tarde',
  excusa  = 'excusa',
}

export class Asistencia {
  id_asistencia:   string;
  estado:          EstadoAsistencia;
  hora:            string;
  observaciones:   string;
  formacion_fk:    string;
  archivo_soporte: string;
}
