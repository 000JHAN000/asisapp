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
  id_persona:      string;
  documento:       string;
  nombres:         string;
  apellidos:       string | null;
  direccion:       string | null;
  telefono:        string | null;
  correo:          string;
  genero:          GeneroPersona | null;
  estado:          EstadoPersona;
  tipo_doc:        string | null;
  municipio_nombre: string | null;
  municipio_fk:    string | null;
  facePhotoPath:   string | null;
  faceEmbedding:   string | null;
  lastAttendancePhotoPath: string | null;
}