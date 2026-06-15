// infrastructure/http/dto/create-acceso.dto.ts

import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { EstadoAcceso } from '../../../domain/entities/acceso.entity';

export class CreateAccesoDto {
  @IsString()
  @MaxLength(555)
  token: string;

  @IsUUID()
  usuario_fk: string;

  @IsOptional()
  fecha_salida: Date;

  @IsOptional()
  @IsEnum(EstadoAcceso)
  estado: EstadoAcceso;
}