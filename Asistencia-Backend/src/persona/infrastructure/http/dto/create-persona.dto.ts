// infrastructure/http/dto/create-persona.dto.ts

import { IsEmail, IsEnum, IsInt, IsString, IsUUID, Length } from 'class-validator';
import { EstadoPersona, GeneroPersona } from '../../../domain/entities/persona.entity';

export class CreatePersonaDto {
  @IsInt()
  documento: number;

  @IsString()
  @Length(1, 50)
  nombres: string;

  @IsString()
  @Length(1, 50)
  direccion: string;

  @IsString()
  @Length(1, 15)
  telefono: string;

  @IsEmail()
  correo: string;

  @IsEnum(GeneroPersona)
  genero: GeneroPersona;

  @IsEnum(EstadoPersona)
  estado: EstadoPersona;

  @IsUUID()
  municipio_fk: string;
}