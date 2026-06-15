// infrastructure/http/dto/create-ambiente.dto.ts

import { IsString, IsUUID, Length } from 'class-validator';

export class CreateAmbienteDto {
  @IsString()
  @Length(1, 50)
  nombre: string;

  @IsUUID()
  area_fk: string;
}