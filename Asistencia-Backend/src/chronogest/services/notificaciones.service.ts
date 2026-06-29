import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Notificacion } from '../entities/notificacion.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class NotificacionesService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, Notificacion);
  }

  async findAll() {
    const repo = await this.getRepo();
    return repo.find();
  }

  async findOne(id: string) {
    const repo = await this.getRepo();
    return repo.findOne({ where: { id } });
  }

  async create(data: Partial<Notificacion>) {
    const repo = await this.getRepo();
    const entity = repo.create(data);
    return repo.save(entity);
  }

  async update(id: string, data: Partial<Notificacion>) {
    const repo = await this.getRepo();
    await repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const repo = await this.getRepo();
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Notificación no encontrada');
    return repo.remove(entity);
  }

  async findByDestinatario(destinatarioId?: string, destinatarioRol?: string) {
    const repo = await this.getRepo();
    const where: any[] = [];
    if (destinatarioId) where.push({ destinatarioId });
    if (destinatarioRol) where.push({ destinatarioRol });
    if (where.length === 0) return repo.find();
    return repo.find({ where });
  }

  async marcarLeida(id: string) {
    const repo = await this.getRepo();
    const notif = await this.findOne(id);
    if (!notif) throw new NotFoundException('Notificación no encontrada');
    notif.leida = true;
    return repo.save(notif);
  }

  async marcarTodasLeidas(destinatarioRol: string) {
    const repo = await this.getRepo();
    await repo.update({ destinatarioRol }, { leida: true });
    return { affected: true };
  }
}
