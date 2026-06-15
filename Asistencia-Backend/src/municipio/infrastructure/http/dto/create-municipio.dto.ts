// infrastructure/http/dto/create-municipio.dto.ts

import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateMunicipioDto {
  @IsString()
  @MinLength(3)
  nombre: string;

  @IsUUID()
  departamento_fk: string;
}