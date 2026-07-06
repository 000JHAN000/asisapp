import { Module } from '@nestjs/common';
import { TenantConnectionManager } from './tenant-connection.manager';
import { tenantDataSourceProvider, TENANT_DATA_SOURCE } from './tenant-data-source.provider';
import { TenantRepositoryFactory } from './tenant-repository.factory';
import { TenantsController } from 'src/auth/infrastructure/http/tenants.controller';

@Module({
  controllers: [TenantsController],
  providers: [TenantConnectionManager, tenantDataSourceProvider, TenantRepositoryFactory],
  exports: [TenantConnectionManager, TENANT_DATA_SOURCE, TenantRepositoryFactory],
})
export class TenantModule {}
