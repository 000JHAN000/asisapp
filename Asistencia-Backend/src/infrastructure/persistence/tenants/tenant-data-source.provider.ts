import { Provider, Scope } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getCurrentTenantId } from '../../config/tenant-context';
import { TenantConnectionManager } from './tenant-connection.manager';

export const TENANT_DATA_SOURCE = 'TENANT_DATA_SOURCE';

export const tenantDataSourceProvider: Provider = {
  provide: TENANT_DATA_SOURCE,
  scope: Scope.REQUEST,
  useFactory: async (connectionManager: TenantConnectionManager): Promise<DataSource> => {
    const tenantId = getCurrentTenantId();

    if (!tenantId) {
      throw new Error('No se encontró un tenantId en el contexto actual');
    }

    return connectionManager.getTenantDataSource(tenantId);
  },
  inject: [TenantConnectionManager],
};
