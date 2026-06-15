// infrastructure/http/dto/create-credencial.dto.ts

import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCredencialDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  login: string;

  @IsString()
  @MinLength(4)
  @MaxLength(100)
  password: string;

  @IsUUID()
  rol_fk: string;

  @IsUUID()
  usuario_fk: string;
}