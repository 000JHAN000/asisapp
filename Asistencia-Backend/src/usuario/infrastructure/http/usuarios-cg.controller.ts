import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { UsuariosCGService } from 'src/usuario/application/usuarios-cg.service';
import { JwtGuard } from 'src/auth/infrastructure/guards/jwt.guard';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtGuard)
@Controller('usuarios')
export class UsuariosCGController {
  constructor(private readonly usuariosCGService: UsuariosCGService) {}

  @Roles('admin')
  @Patch('tenant')
  updateTenant(
    @Body() body: { documento: string; tenantSlug: string | null },
  ) {
    return this.usuariosCGService.updateTenantByDocumento(body.documento, body.tenantSlug);
  }

  @Roles('admin')
  @Patch('activo')
  updateActivo(
    @Body() body: { documento: string; activo: boolean },
  ) {
    return this.usuariosCGService.updateActivoByDocumento(body.documento, body.activo);
  }

  @Roles('admin')
  @Patch('municipio')
  updateMunicipio(
    @Body() body: { documento: string; municipio: string | null },
  ) {
    return this.usuariosCGService.updateMunicipioByDocumento(body.documento, body.municipio);
  }
}
