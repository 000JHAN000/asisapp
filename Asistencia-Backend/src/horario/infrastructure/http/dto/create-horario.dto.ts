import { IsDateString, IsString, IsUUID } from 'class-validator';

export class CreateHorarioDto {
  @IsUUID()
  curso_fk: string;

  @IsUUID()
  ambiente_fk: string;

  @IsDateString()
  fecha: Date;

  @IsString()
  hora_inicio: string;

  @IsString()
  hora_fin: string;
}
