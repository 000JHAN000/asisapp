import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from 'src/super-admin/guards/super-admin.guard';
import { TenantProvisioningService } from 'src/auth/application/tenant-provisioning.service';
import type { CreateTenantInput } from 'src/auth/application/tenant-provisioning.service';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';

@Controller('super-admin/tenants')
@UseGuards(SuperAdminGuard)
export class TenantsAdminController {
  constructor(
    private readonly provisioningService: TenantProvisioningService,
    private readonly tenantConnectionManager: TenantConnectionManager,
  ) {}

  @Get()
  async findAll() {
    return this.tenantConnectionManager.findAll();
  }

  @Post()
  async create(@Body() body: CreateTenantInput) {
    return this.provisioningService.createTenant(body);
  }

  @Patch(':slug/status')
  async toggleStatus(@Body() body: { slug: string; activo: boolean }) {
    return this.provisioningService.toggleTenantStatus(body.slug, body.activo);
  }
}
