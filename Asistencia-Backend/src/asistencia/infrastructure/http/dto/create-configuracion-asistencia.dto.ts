import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateConfiguracionAsistenciaDto {
  @IsOptional()
  @IsBoolean()
  firma: boolean;

  @IsOptional()
  @IsBoolean()
  foto: boolean;

  @IsUUID()
  matricula_fk: string;
}
