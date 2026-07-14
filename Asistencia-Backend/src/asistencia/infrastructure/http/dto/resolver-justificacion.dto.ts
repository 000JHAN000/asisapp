import { IsBoolean } from 'class-validator';

export class ResolverJustificacionDto {
  @IsBoolean()
  aprobar: boolean;
}
