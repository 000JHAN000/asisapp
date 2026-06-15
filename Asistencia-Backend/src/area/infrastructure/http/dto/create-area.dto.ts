// infrastructure/http/dto/create-area.dto.ts

import { IsString, IsUUID, Length } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  @Length(1, 40)
  nombre: string;

  @IsUUID()
  sede_fk: string;
}