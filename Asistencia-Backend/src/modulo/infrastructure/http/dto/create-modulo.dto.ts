// infrastructure/http/dto/create-modulo.dto.ts

import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateModuloDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nombre: string;

  @IsUUID()
  aplicativo_fk: string;
}