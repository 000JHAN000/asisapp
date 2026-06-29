import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AprendizSeedDto {
  nombre: string;
  apellido: string;
  correo: string;
  documento: string;
  fichaId?: string;
}

export class BulkAprendicesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AprendizSeedDto)
  aprendices: AprendizSeedDto[];
}
