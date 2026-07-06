import { Injectable, BadRequestException } from '@nestjs/common';
import { Between, In } from 'typeorm';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../../infrastructure/config/tenant-context';
import { AsistenciaSesionTenantEntity } from '../entities/tenant/asistencia-sesion.tenant-entity';
import { AsistenciaSesionRepositoryPort } from '../../domain/ports/asistencia-sesion.repository.port';
import { AsistenciaSesion } from '../../domain/entities/asistencia-sesion.entity';

@Injectable()
export class AsistenciaSesionTypeOrmRepository implements AsistenciaSesionRepositoryPort {
  constructor(private readonly connectionManager: TenantConnectionManager) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new BadRequestException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private repo() {
    return this.connectionManager.getTenantRepository(this.tenantId, AsistenciaSesionTenantEntity);
  }

  async crear(datos: Partial<AsistenciaSesion>): Promise<AsistenciaSesion> {
    const repo = await this.repo();
    const nueva = repo.create(datos as any);
    return (await repo.save(nueva)) as any;
  }

  async cerrarActivasDeInstructor(instructorId: string): Promise<void> {
    const repo = await this.repo();
    await repo.update({ instructorId, estado: 'activa' }, { estado: 'cerrada' });
  }

  async buscarPorId(id: string): Promise<AsistenciaSesion | null> {
    const repo = await this.repo();
    return repo.findOne({ where: { id } });
  }

  async buscarActivaPorHorario(horarioId: string): Promise<AsistenciaSesion | null> {
    const repo = await this.repo();
    return repo.findOne({ where: { horarioId, estado: 'activa' } });
  }

  async buscarActivasPorInstructor(instructorId: string): Promise<AsistenciaSesion[]> {
    const repo = await this.repo();
    return repo.find({ where: { instructorId, estado: 'activa' } });
  }

  async buscarActivaPorHorarioIds(horarioIds: string[]): Promise<AsistenciaSesion | null> {
    if (!horarioIds.length) return null;
    const repo = await this.repo();
    return repo.findOne({ where: { horarioId: In(horarioIds), estado: 'activa' } });
  }

  async guardar(sesion: AsistenciaSesion): Promise<AsistenciaSesion> {
    const repo = await this.repo();
    return repo.save(sesion as any);
  }

  async buscarPorFiltros(filtros: {
    fecha?: string;
    horarioIds?: string[];
    instructorId?: string;
  }): Promise<AsistenciaSesion[]> {
    const repo = await this.repo();
    const where: any = {};
    if (filtros.fecha) where.fecha = filtros.fecha;
    if (filtros.instructorId) where.instructorId = filtros.instructorId;
    if (filtros.horarioIds) where.horarioId = In(filtros.horarioIds);
    return repo.find({ where, order: { fecha: 'DESC', horaInicio: 'DESC' } });
  }

  async buscarPorHorarioIdsYRangoFecha(
    horarioIds: string[],
    desde: string,
    hasta: string,
  ): Promise<AsistenciaSesion[]> {
    if (!horarioIds.length) return [];
    const repo = await this.repo();
    return repo.find({
      where: { horarioId: In(horarioIds), fecha: Between(desde, hasta) },
      order: { fecha: 'ASC' },
    });
  }
}
