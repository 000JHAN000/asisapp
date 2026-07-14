import { BadRequestException, Injectable } from '@nestjs/common';
import { AmbienteOrmEntity } from 'src/ambiente/infrastructure/entities/ambiente.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class AmbientesCGService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, AmbienteOrmEntity);
  }

  async findAll() {
    const repo = await this.getRepo();
    return repo.find({ relations: ['area'] });
  }

  async create(data: any) {
    const repo = await this.getRepo();
    return repo.save({
      nombre: data.nombre ?? '',
      capacidad: data.capacidad ?? null,
      tipo: data.tipo ?? null,
      area_fk: data.area_fk ?? data.areaFk,
    });
  }

  async update(id: string, data: any) {
    const repo = await this.getRepo();
    await repo.update({ id_ambiente: id }, {
      ...(data.nombre !== undefined && { nombre: data.nombre }),
      ...(data.capacidad !== undefined && { capacidad: data.capacidad }),
      ...(data.tipo !== undefined && { tipo: data.tipo }),
      ...((data.area_fk ?? data.areaFk) !== undefined && { area_fk: data.area_fk ?? data.areaFk }),
    });
    return repo.findOne({ where: { id_ambiente: id }, relations: ['area'] });
  }

  async remove(id: string) {
    const repo = await this.getRepo();
    await repo.delete({ id_ambiente: id });
    return { success: true };
  }

  async findDisponibilidad(dia: string, jornada: string) {
    const repo = await this.getRepo();
    const ambientes = await repo.find({ relations: ['area'] });
    return ambientes.map((ambiente) => ({
      ...ambiente,
      disponible: true,
    }));
  }

  async findLibresAhora() {
    const repo = await this.getRepo();
    return repo.find({ relations: ['area'] });
  }
}
