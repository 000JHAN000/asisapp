import { Body, Controller, Patch } from '@nestjs/common';
import { UsuariosCGService } from '../services/usuarios-cg.service';

@Controller('usuarios')
export class UsuariosCGController {
  constructor(private readonly usuariosCGService: UsuariosCGService) {}

  @Patch('tenant')
  updateTenant(
    @Body() body: { documento: string; tenantSlug: string | null },
  ) {
    return this.usuariosCGService.updateTenantByDocumento(body.documento, body.tenantSlug);
  }
}
