export enum EstadoFormacionAsistencia {
  abierta  = 'abierta',
  cerrada  = 'cerrada',
}

export class FormacionAsistencia {
  id_formacion:      string;
  fecha:             Date;
  hora_inicio:       string;
  hora_fin:          string;
  horario_fk:        string;
  configuracion_fk:  string;
  estado:            EstadoFormacionAsistencia;
}
