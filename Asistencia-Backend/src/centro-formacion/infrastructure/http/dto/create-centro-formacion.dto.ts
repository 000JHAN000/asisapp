// infrastructure/http/dto/create-centro-formacion.dto.ts

import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCentroFormacionDto {
  @IsString()
  @MinLength(10)
  nombre: string;

  @IsUUID()
  municipio_fk: string;
}