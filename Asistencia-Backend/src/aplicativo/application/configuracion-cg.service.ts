import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfiguracionAppOrmEntity } from 'src/aplicativo/infrastructure/entities/configuracion-app.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class ConfiguracionCGService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, ConfiguracionAppOrmEntity);
  }

  async find() {
    const repo = await this.getRepo();
    let config = await repo.findOne({ where: {} });
    if (!config) {
      config = repo.create({ pin_registro: '1234' });
      config = await repo.save(config);
    }
    return config;
  }

  async updatePin(pin: string) {
    const repo = await this.getRepo();
    const config = await this.find();
    config.pin_registro = pin;
    return repo.save(config);
  }
}
