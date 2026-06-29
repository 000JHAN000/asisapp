import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfiguracionApp } from '../entities/configuracion-app.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class ConfiguracionService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, ConfiguracionApp);
  }

  async find() {
    const repo = await this.getRepo();
    let config = await repo.findOne({ where: {} });
    if (!config) {
      config = repo.create({ pinRegistro: '1234' });
      config = await repo.save(config);
    }
    return config;
  }

  async updatePin(pin: string) {
    const repo = await this.getRepo();
    const config = await this.find();
    config.pinRegistro = pin;
    return repo.save(config);
  }
}
