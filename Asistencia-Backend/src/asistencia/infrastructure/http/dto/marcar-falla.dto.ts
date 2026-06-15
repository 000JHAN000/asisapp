import { IsOptional, IsString, IsUUID } from 'class-validator';

export class MarcarFallaDto {
  @IsUUID()
  sesionId: string;

  @IsUUID()
  aprendizId: string;

  @IsOptional()
  @IsString()
  nota?: string;

  @IsOptional()
  @IsString()
  soporte?: string;
}
