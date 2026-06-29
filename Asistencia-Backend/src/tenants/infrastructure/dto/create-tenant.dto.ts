import { IsString, IsOptional } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  slug: string;

  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  dbName?: string;
}
