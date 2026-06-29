import { BadRequestException, Injectable } from '@nestjs/common';
import { AmbienteCG } from '../entities/ambiente-cg.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class AmbientesService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, AmbienteCG);
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

  async findDisponibilidad(dia: string, jornada: string) {
    const repo = await this.getRepo();
    const ambientes = await repo.find();
    return ambientes.map((ambiente) => ({
      ...ambiente,
      disponible: true,
    }));
  }

  async findLibresAhora() {
    const repo = await this.getRepo();
    return repo.find();
  }
}
