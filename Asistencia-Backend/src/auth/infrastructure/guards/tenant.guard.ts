// infrastructure/guards/tenant.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const TENANT_KEY = 'tenant_check';

// Decorador para activarlo por ruta
export const CheckTenant = () => 
  SetMetadata(TENANT_KEY, true);

@Injectable()
export class TenantGuard implements CanActivate {

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresTenant = this.reflector.getAllAndOverride<boolean>(TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresTenant) return true;

    const request       = context.switchToHttp().getRequest();
    const usuario       = request.user;
    const aplicativoId  = request.headers['x-aplicativo-id'];

    if (!aplicativoId) {
      throw new ForbiddenException('Header x-aplicativo-id requerido');
    }

    if (usuario.aplicativo_fk !== aplicativoId) {
      throw new ForbiddenException('No perteneces a este aplicativo');
    }

    // 👇 inyectar en el request para usarlo en servicios
    request.tenantId = aplicativoId;

    return true;
  }
}