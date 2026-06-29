import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Evento } from '../entities/evento.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class EventosService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, Evento);
  }

  async findAll() {
    const repo = await this.getRepo();
    return repo.find();
  }

  async findOne(id: string) {
    const repo = await this.getRepo();
    return repo.findOne({ where: { id } });
  }

  async create(data: Partial<Evento>) {
    const repo = await this.getRepo();
    const entity = repo.create(data);
    return repo.save(entity);
  }

  async update(id: string, data: Partial<Evento>) {
    const repo = await this.getRepo();
    await repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const repo = await this.getRepo();
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Evento no encontrado');
    return repo.remove(entity);
  }
}
