import { Injectable } from '@nestjs/common';
import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { getCurrentTenantId } from '../../config/tenant-context';
import { TenantConnectionManager } from './tenant-connection.manager';

@Injectable()
export class TenantRepositoryFactory {
  constructor(private readonly connectionManager: TenantConnectionManager) {}

  async getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): Promise<Repository<T>> {
    const tenantId = getCurrentTenantId();

    if (!tenantId) {
      throw new Error('No se encontró un tenantId en el contexto actual');
    }

    return this.connectionManager.getTenantRepository(tenantId, entity);
  }
}
