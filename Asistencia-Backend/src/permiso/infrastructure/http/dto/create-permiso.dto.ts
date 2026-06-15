// infrastructure/http/dto/create-permiso.dto.ts

import { IsUUID } from 'class-validator';

export class CreatePermisoDto {
  @IsUUID()
  usuario_fk: string;

  @IsUUID()
  rol_fk: string;

  @IsUUID()
  servicio_fk: string;
}