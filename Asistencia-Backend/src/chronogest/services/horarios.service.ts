import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { HorarioCG } from '../entities/horario-cg.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class HorariosService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, HorarioCG);
  }

  async findAll() {
    const repo = await this.getRepo();
    return repo.find();
  }

  async findOne(id: string) {
    const repo = await this.getRepo();
    return repo.findOne({ where: { id } });
  }

  async create(data: Partial<HorarioCG>) {
    const repo = await this.getRepo();
    const entity = repo.create(data);
    return repo.save(entity);
  }

  async update(id: string, data: Partial<HorarioCG>) {
    const repo = await this.getRepo();
    await repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const repo = await this.getRepo();
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Horario no encontrado');
    return repo.remove(entity);
  }

  async findByInstructor(instructorId: string) {
    const repo = await this.getRepo();
    return repo.find({ where: { instructorId } });
  }

  async findByFicha(fichaId: string) {
    const repo = await this.getRepo();
    return repo.find({ where: { fichaId } });
  }

  async findByAmbiente(ambienteId: string) {
    const repo = await this.getRepo();
    return repo.find({ where: { ambienteId } });
  }

  async toggle(id: string) {
    const repo = await this.getRepo();
    const horario = await this.findOne(id);
    if (!horario) throw new NotFoundException('Horario no encontrado');
    horario.activo = !horario.activo;
    horario.estado = horario.activo ? 'activo' : 'programado';
    return repo.save(horario);
  }

  async play(
    id: string,
    payload?: {
      ambienteId?: string;
      ubicacionTransversalNombre?: string;
    },
  ) {
    const repo = await this.getRepo();
    const horario = await this.findOne(id);
    if (!horario) throw new NotFoundException('Horario no encontrado');
    horario.activo = true;
    horario.estado = 'activo';
    if (payload?.ambienteId) horario.ambienteId = payload.ambienteId;
    if (payload?.ubicacionTransversalNombre)
      horario.ubicacionTransversalNombre = payload.ubicacionTransversalNombre;
    return repo.save(horario);
  }

  async finalizar(id: string, _motivo?: string) {
    const repo = await this.getRepo();
    const horario = await this.findOne(id);
    if (!horario) throw new NotFoundException('Horario no encontrado');
    horario.activo = false;
    horario.estado = 'finalizado';
    return repo.save(horario);
  }

  async finalizarTransversal(id: string) {
    const repo = await this.getRepo();
    const horario = await this.findOne(id);
    if (!horario) throw new NotFoundException('Horario no encontrado');
    horario.activo = false;
    horario.estado = 'finalizado';
    (horario as any).ubicacionTransversalNombre = null;
    return repo.save(horario);
  }

  async getStats() {
    const repo = await this.getRepo();
    const total = await repo.count();
    const activos = await repo.count({ where: { activo: true } });
    return { total, activos };
  }
}
