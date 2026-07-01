import { BadRequestException, Injectable } from '@nestjs/common';
import { Ficha } from 'src/curso/infrastructure/entities/ficha.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class FichasCGService {
  constructor(
    private readonly connectionManager: TenantConnectionManager,
  ) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new BadRequestException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private async getRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, Ficha);
  }

  async findAll() {
    const repo = await this.getRepo();
    return repo.find();
  }

  async create(data: any) {
    const repo = await this.getRepo();
    return repo.save(data);
  }

  async update(id: string, data: any) {
    const repo = await this.getRepo();
    await repo.update(id, data);
    return repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    const repo = await this.getRepo();
    await repo.delete(id);
    return { success: true };
  }
}
