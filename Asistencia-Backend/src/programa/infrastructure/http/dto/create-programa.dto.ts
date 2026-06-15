// infrastructure/http/dto/create-programa.dto.ts

import { IsString, Length } from 'class-validator';

export class CreateProgramaDto {
  @IsString()
  @Length(1, 100)
  nombre: string;

  @IsString()
  @Length(1, 50)
  tipo_programa: string;
}