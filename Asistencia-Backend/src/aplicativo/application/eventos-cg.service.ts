import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventoOrmEntity } from 'src/aplicativo/infrastructure/entities/evento.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class EventosCGService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, EventoOrmEntity);
  }

  async findAll() {
    const repo = await this.getRepo();
    return repo.find();
  }

  async findOne(id: string) {
    const repo = await this.getRepo();
    return repo.findOne({ where: { id_evento: id } });
  }

  private mapDtoToEntity(data: any): Partial<EventoOrmEntity> {
    return {
      id_evento: data.id,
      nombre: data.nombre,
      tipo: data.tipo,
      fecha_inicio: data.fechaInicio,
      fecha_fin: data.fechaFin,
      hora_inicio: data.horaInicio,
      hora_fin: data.horaFin,
      lugar: data.lugar,
      descripcion: data.descripcion,
      fichas: data.fichas,
    };
  }

  async create(data: any) {
    const repo = await this.getRepo();
    const entity = repo.create(this.mapDtoToEntity(data));
    return repo.save(entity);
  }

  async update(id: string, data: any) {
    const repo = await this.getRepo();
    await repo.update({ id_evento: id }, this.mapDtoToEntity(data));
    return this.findOne(id);
  }

  async remove(id: string) {
    const repo = await this.getRepo();
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('EventoOrmEntity no encontrado');
    return repo.remove(entity);
  }
}
