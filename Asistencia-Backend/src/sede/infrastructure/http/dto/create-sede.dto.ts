// infrastructure/http/dto/create-sede.dto.ts

import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateSedeDto {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsUUID()
  centro_formacion_fk: string;
}