// domain/entities/persona.entity.ts

export enum GeneroPersona {
  masculino = 'masculino',
  femenino  = 'femenino',
}

export enum EstadoPersona {
  activo   = 'activo',
  inactivo = 'inactivo',
}

export class Persona {
  id_persona:   string;
  documento:    number;
  nombres:      string;
  direccion:    string;
  telefono:     string;
  correo:       string;
  genero:       GeneroPersona;
  estado:       EstadoPersona;
  municipio_fk: string;
}