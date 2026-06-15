import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EstadoAsistencia } from '../../../domain/entities/asistencia.entity';

export class CreateAsistenciaDto {
  @IsEnum(EstadoAsistencia)
  estado: EstadoAsistencia;

  @IsString()
  hora: string;

  @IsOptional()
  @IsString()
  observaciones: string;

  @IsUUID()
  formacion_fk: string;

  @IsOptional()
  @IsString()
  archivo_soporte: string;
}
