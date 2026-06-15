// infrastructure/http/dto/create-rol.dto.ts

import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateRolDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nombre: string;

  @IsUUID()
  aplicativo_fk: string;
}