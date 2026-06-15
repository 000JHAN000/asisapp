// domain/entities/curso.entity.ts

export class Curso {
  id_curso: string;
  codigo: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  fin_lectiva: Date;
  area_fk: string;
  programa_fk: string;
  lider: string;
}