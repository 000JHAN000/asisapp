import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SolicitudCambioOrmEntity } from 'src/aplicativo/infrastructure/entities/solicitud-cambio.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class SolicitudesCGService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, SolicitudCambioOrmEntity);
  }

  async findAll() {
    const repo = await this.getRepo();
    return repo.find();
  }

  async findOne(id: string) {
    const repo = await this.getRepo();
    return repo.findOne({ where: { id_solicitud: id } });
  }

  private mapDtoToEntity(data: any): Partial<SolicitudCambioOrmEntity> {
    return {
      id_solicitud: data.id,
      instructor_fk: data.instructorId,
      horario_fk: data.horarioId,
      tipo: data.tipo,
      estado: data.estado,
      motivo: data.motivo,
      respuesta_admin: data.respuestaAdmin,
      fecha_solicitud: data.fechaSolicitud,
    };
  }

  async create(data: any) {
    const repo = await this.getRepo();
    const entity = repo.create(this.mapDtoToEntity(data));
    return repo.save(entity);
  }

  async update(id: string, data: any) {
    const repo = await this.getRepo();
    await repo.update({ id_solicitud: id }, this.mapDtoToEntity(data));
    return this.findOne(id);
  }

  async remove(id: string) {
    const repo = await this.getRepo();
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Solicitud no encontrada');
    return repo.remove(entity);
  }

  async findByInstructor(instructor_fk: string) {
    const repo = await this.getRepo();
    return repo.find({ where: { instructor_fk } });
  }

  async countPendientes() {
    const repo = await this.getRepo();
    return repo.count({ where: { estado: 'pendiente' } });
  }

  async responder(
    id: string,
    estado: 'aprobada' | 'rechazada',
    respuesta_admin?: string,
  ) {
    const repo = await this.getRepo();
    const solicitud = await this.findOne(id);
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    solicitud.estado = estado;
    if (respuesta_admin !== undefined) solicitud.respuesta_admin = respuesta_admin;
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
