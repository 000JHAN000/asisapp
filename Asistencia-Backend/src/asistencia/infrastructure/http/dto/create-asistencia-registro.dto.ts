import { IsOptional, IsString, IsUUID, IsDecimal } from 'class-validator';

export class CreateAsistenciaRegistroDto {
  @IsUUID()
  sesionId: string;

  @IsOptional()
  @IsUUID()
  aprendizId?: string;

  @IsString()
  firmaImagen: string;

  @IsOptional()
  faceVerificationImage?: any;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  latitud?: number;

  @IsOptional()
  longitud?: number;

  @IsOptional()
  @IsString()
  documento?: string;
}
