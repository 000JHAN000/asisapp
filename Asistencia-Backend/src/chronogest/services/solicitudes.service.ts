import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SolicitudCambio } from '../entities/solicitud-cambio.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class SolicitudesService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, SolicitudCambio);
  }

  async findAll() {
    const repo = await this.getRepo();
    return repo.find();
  }

  async findOne(id: string) {
    const repo = await this.getRepo();
    return repo.findOne({ where: { id } });
  }

  async create(data: Partial<SolicitudCambio>) {
    const repo = await this.getRepo();
    const entity = repo.create(data);
    return repo.save(entity);
  }

  async update(id: string, data: Partial<SolicitudCambio>) {
    const repo = await this.getRepo();
    await repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const repo = await this.getRepo();
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Solicitud no encontrada');
    return repo.remove(entity);
  }

  async findByInstructor(instructorId: string) {
    const repo = await this.getRepo();
    return repo.find({ where: { instructorId } });
  }

  async countPendientes() {
    const repo = await this.getRepo();
    return repo.count({ where: { estado: 'pendiente' } });
  }

  async responder(
    id: string,
    estado: 'aprobada' | 'rechazada',
    respuestaAdmin?: string,
  ) {
    const repo = await this.getRepo();
    const solicitud = await this.findOne(id);
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    solicitud.estado = estado;
    if (respuestaAdmin !== undefined) solicitud.respuestaAdmin = respuestaAdmin;
    return repo.save(solicitud);
  }

  async cancelar(id: string) {
    const repo = await this.getRepo();
    const solicitud = await this.findOne(id);
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    solicitud.estado = 'cancelada';
    return repo.save(solicitud);
  }
}
