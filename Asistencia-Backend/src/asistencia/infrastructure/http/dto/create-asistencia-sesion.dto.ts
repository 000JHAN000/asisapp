import { IsEnum, IsString, IsUUID } from 'class-validator';

export class CreateAsistenciaSesionDto {
  @IsUUID()
  horarioId: string;

  @IsString()
  fecha: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;
}
