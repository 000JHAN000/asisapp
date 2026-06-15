// infrastructure/http/dto/create-servicio.dto.ts

import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateServicioDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nombre: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  url: string;

  @IsUUID()
  modulo_fk: string;
}