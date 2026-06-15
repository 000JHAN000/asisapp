// infrastructure/http/dto/create-matricula.dto.ts

import { IsUUID } from 'class-validator';

export class CreateMatriculaDto {
  @IsUUID()
  persona_fk: string;

  @IsUUID()
  curso_fk: string;
}