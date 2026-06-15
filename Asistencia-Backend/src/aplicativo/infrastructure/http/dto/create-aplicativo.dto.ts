// infrastructure/http/dto/create-aplicativo.dto.ts

import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAplicativoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nombre: string;
}