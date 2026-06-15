// domain/entities/acceso.entity.ts

export enum EstadoAcceso {
    activo   = 'activo',
    inactivo = 'inactivo',
}

export class Acceso {
    id_acceso:     string;
    token:         string;
    usuario_fk:    string;
    fecha_ingreso: Date;
    fecha_salida:  Date;
    estado:        EstadoAcceso;
}