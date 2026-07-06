import { Injectable, BadRequestException } from '@nestjs/common';
import { In } from 'typeorm';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../../infrastructure/config/tenant-context';
import { AsistenciaRegistroTenantEntity } from '../entities/tenant/asistencia-registro.tenant-entity';
import { AsistenciaRegistroRepositoryPort } from '../../domain/ports/asistencia-registro.repository.port';
import { AsistenciaRegistro } from '../../domain/entities/asistencia-registro.entity';

@Injectable()
export class AsistenciaRegistroTypeOrmRepository implements AsistenciaRegistroRepositoryPort {
  constructor(private readonly connectionManager: TenantConnectionManager) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new BadRequestException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private repo() {
    return this.connectionManager.getTenantRepository(this.tenantId, AsistenciaRegistroTenantEntity);
  }

  async buscarPorSesion(sesionId: string): Promise<AsistenciaRegistro[]> {
    const repo = await this.repo();
    return repo.find({ where: { sesionId } });
  }

  async buscarPorSesiones(sesionIds: string[]): Promise<AsistenciaRegistro[]> {
    if (!sesionIds.length) return [];
    const repo = await this.repo();
    return repo.find({ where: { sesionId: In(sesionIds) } });
  }

  async buscarUno(sesionId: string, aprendizId?: string): Promise<AsistenciaRegistro | null> {
    const repo = await this.repo();
    const where: any = { sesionId };
    if (aprendizId !== undefined) where.aprendizId = aprendizId;
    return repo.findOne({ where });
  }

  async crear(datos: Partial<AsistenciaRegistro>): Promise<AsistenciaRegistro> {
    const repo = await this.repo();
    const nuevo = repo.create(datos as any);
    const saved = await repo.save(nuevo);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async guardar(registro: AsistenciaRegistro): Promise<AsistenciaRegistro> {
    const repo = await this.repo();
    return repo.save(registro as any);
  }
}
