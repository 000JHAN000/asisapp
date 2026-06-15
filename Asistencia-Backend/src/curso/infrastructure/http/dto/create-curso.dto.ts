// infrastructure/http/dto/create-curso.dto.ts

import { IsDateString, IsString, IsUUID, Length } from 'class-validator';

export class CreateCursoDto {
  @IsString()
  @Length(1, 20)
  codigo: string;

  @IsDateString()
  fecha_inicio: Date;

  @IsDateString()
  fecha_fin: Date;

  @IsDateString()
  fin_lectiva: Date;

  @IsUUID()
  area_fk: string;

  @IsUUID()
  programa_fk: string;

  @IsString()
  @Length(1, 100)
  lider: string;
}