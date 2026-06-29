import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantMatchGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = (request.path ?? '') as string;

    // Las rutas de super-administración usan su propio guard/estrategia.
    if (path.startsWith('/super-admin')) {
      return true;
    }

    const user = request.user;

    // Rutas públicas aún no tienen usuario autenticado.
    if (!user) {
      return true;
    }

    // Super admin de plataforma: explícitamente permitido, sin importar tenant.
    if (user.scope === 'platform') {
      return true;
    }

    const tenantId = request.headers['x-tenant-id'] as string | undefined;

    // Si no hay header de tenant, el middleware se encargará del comportamiento
    // por defecto; aquí no forzamos nada.
    if (!tenantId) {
      return true;
    }

    // Un usuario autenticado sin sede asignada no puede operar en ningún tenant.
    if (!user.tenantSlug) {
      throw new ForbiddenException('Acceso no autorizado a este tenant');
    }

    // El tenant del JWT debe coincidir con el header explicitamente.
    if (user.tenantSlug !== tenantId) {
      throw new ForbiddenException('Acceso no autorizado a este tenant');
    }

    return true;
  }
}
