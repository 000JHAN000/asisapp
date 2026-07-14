import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SolicitarJustificacionDto {
  @IsUUID()
  sesionId: string;

  // Se sobrescribe siempre con el perfil del usuario autenticado (ver controller);
  // no se debe confiar en un aprendizId enviado por el cliente.
  aprendizId?: string;

  @IsNotEmpty()
  @IsString()
  nota: string;

  @IsOptional()
  @IsString()
  soporte?: string;
}
