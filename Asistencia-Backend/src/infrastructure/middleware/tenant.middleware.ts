import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../config/tenant-context';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly connectionManager: TenantConnectionManager) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Rutas de super administrador no requieren tenant
    if (req.path.startsWith('/super-admin')) {
      tenantStorage.run({ tenantId: '' }, () => next());
      return;
    }

    const tenantId = req.headers['x-tenant-id'] as string | undefined;

    // Rutas públicas de catálogo de tenants pueden no traer header.
    if (!tenantId) {
      tenantStorage.run({ tenantId: '' }, () => next());
      return;
    }

    // Validar que el tenant exista en el catálogo maestro.
    try {
      await this.connectionManager.resolveTenant(tenantId);
    } catch {
      throw new BadRequestException(`Tenant '${tenantId}' no está registrado`);
    }

    tenantStorage.run({ tenantId }, () => {
      next();
    });
  }
}
