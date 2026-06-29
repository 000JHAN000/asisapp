import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Ubicacion } from '../entities/ubicacion.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class UbicacionesService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, Ubicacion);
  }

  async findAll() {
    const repo = await this.getRepo();
    return repo.find();
  }

  async findOne(id: string) {
    const repo = await this.getRepo();
    return repo.findOne({ where: { id } });
  }

  async create(data: Partial<Ubicacion>) {
    const repo = await this.getRepo();
    const entity = repo.create(data);
    return repo.save(entity);
  }

  async update(id: string, data: Partial<Ubicacion>) {
    const repo = await this.getRepo();
    await repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const repo = await this.getRepo();
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Ubicación no encontrada');
    return repo.remove(entity);
  }

  async findTipos() {
    const repo = await this.getRepo();
    const result = await repo
      .createQueryBuilder('ubicacion')
      .select('DISTINCT ubicacion.tipo', 'tipo')
      .getRawMany();
    return result.map((r) => r.tipo);
  }

  async findByTipo(tipo: string) {
    const repo = await this.getRepo();
    return repo.find({ where: { tipo } });
  }

  async findDisponiblesTransversal(
    tipo?: string,
    _dia?: string,
    _jornada?: string,
  ) {
    const repo = await this.getRepo();
    if (tipo) {
      return repo.find({ where: { tipo } });
    }
    return repo.find();
  }
}
