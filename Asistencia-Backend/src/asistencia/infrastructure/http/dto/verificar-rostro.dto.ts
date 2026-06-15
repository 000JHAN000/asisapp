import { IsOptional, IsString, IsUUID } from 'class-validator';

export class VerificarRostroDto {
  @IsOptional()
  @IsUUID()
  aprendizId?: string;

  @IsString()
  faceVerificationImage: string;

  @IsOptional()
  @IsString()
  documento?: string;
}
