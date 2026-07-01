// infrastructure/http/dto/create-persona.dto.ts

import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { EstadoPersona, GeneroPersona } from '../../../domain/entities/persona.entity';

export class CreatePersonaDto {
  @IsString()
  @Length(1, 20)
  documento: string;

  @IsString()
  @Length(1, 50)
  nombres: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  apellidos?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  direccion?: string;

  @IsOptional()
  @IsString()
  @Length(1, 15)
  telefono?: string;

  @IsEmail()
  correo: string;

  @IsOptional()
  @IsEnum(GeneroPersona)
  genero?: GeneroPersona;

  @IsEnum(EstadoPersona)
  estado: EstadoPersona;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  tipo_doc?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  municipio_nombre?: string;

  @IsOptional()
  @IsUUID()
  municipio_fk?: string;
}