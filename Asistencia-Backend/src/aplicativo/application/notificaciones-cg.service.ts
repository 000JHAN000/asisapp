import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificacionOrmEntity } from 'src/aplicativo/infrastructure/entities/notificacion.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class NotificacionesCGService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, NotificacionOrmEntity);
  }

  async findAll() {
    const repo = await this.getRepo();
    return repo.find();
  }

  async findOne(id: string) {
    const repo = await this.getRepo();
    return repo.findOne({ where: { id_notificacion: id } });
  }

  private mapDtoToEntity(data: any): Partial<NotificacionOrmEntity> {
    return {
      id_notificacion: data.id,
      titulo: data.titulo,
      mensaje: data.mensaje,
      destinatario_fk: data.destinatarioId,
      destinatario_rol: data.destinatarioRol,
      leida: data.leida,
      fecha: data.fecha,
    };
  }

  async create(data: any) {
    const repo = await this.getRepo();
    const entity = repo.create(this.mapDtoToEntity(data));
    return repo.save(entity);
  }

  async update(id: string, data: any) {
    const repo = await this.getRepo();
    await repo.update({ id_notificacion: id }, this.mapDtoToEntity(data));
    return this.findOne(id);
  }

  async remove(id: string) {
    const repo = await this.getRepo();
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Notificación no encontrada');
    return repo.remove(entity);
  }

  async findByDestinatario(destinatarioId?: string, destinatario_rol?: string) {
    const repo = await this.getRepo();
    const where: any[] = [];
    if (destinatarioId) where.push({ destinatario_fk: destinatarioId });
    if (destinatario_rol) where.push({ destinatario_rol });
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

  async marcarTodasLeidas(destinatario_rol: string) {
    const repo = await this.getRepo();
    await repo.update({ destinatario_rol }, { leida: true });
    return { affected: true };
  }
}
