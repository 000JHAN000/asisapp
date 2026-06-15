import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EstadoFormacionAsistencia } from '../../../domain/entities/formacion-asistencia.entity';

export class CreateFormacionAsistenciaDto {
  @IsDateString()
  fecha: Date;

  @IsString()
  hora_inicio: string;

  @IsString()
  hora_fin: string;

  @IsUUID()
  horario_fk: string;

  @IsUUID()
  configuracion_fk: string;

  @IsOptional()
  @IsEnum(EstadoFormacionAsistencia)
  estado: EstadoFormacionAsistencia;
}
