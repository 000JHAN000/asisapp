import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../auth/infrastructure/decorators/public.decorator';
import { TenantConnectionManager } from '../../../infrastructure/persistence/tenants/tenant-connection.manager';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly connectionManager: TenantConnectionManager) {}

  @Public()
  @Get()
  async list() {
    const tenants = await this.connectionManager.findAll();
    return tenants;
  }
}
