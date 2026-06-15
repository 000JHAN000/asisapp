// infrastructure/http/dto/create-usuario.dto.ts

import { IsUUID } from 'class-validator';

export class CreateUsuarioDto {
  @IsUUID()
  persona_fk: string;

  @IsUUID()
  aplicativo_fk: string;
}