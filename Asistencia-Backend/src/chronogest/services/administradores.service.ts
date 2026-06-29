import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdminCG } from '../entities/admin-cg.entity';
import { UsuarioCG } from '../entities/usuario-cg.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class AdministradoresService {
  constructor(
    @InjectRepository(UsuarioCG)
    private readonly usuarioRepo: Repository<UsuarioCG>,
    private readonly connectionManager: TenantConnectionManager,
  ) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new BadRequestException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private async getAdminRepo(): Promise<Repository<AdminCG>> {
    return this.connectionManager.getTenantRepository(this.tenantId, AdminCG);
  }

  private async enrichWithTenant(list: AdminCG[]) {
    const documentos = list.map(a => a.documento);
    const usuarios = documentos.length
      ? await this.usuarioRepo.find({ where: { documento: In(documentos) } })
      : [];
    const map = new Map(usuarios.map(u => [u.documento, u]));
    return Promise.all(list.map(async a => {
      const u = map.get(a.documento);
      let tenantNombre: string | null = null;
      if (u?.tenantSlug) {
        try {
          const tenant = await this.connectionManager.resolveTenant(u.tenantSlug);
          tenantNombre = tenant.nombre;
        } catch {
          tenantNombre = null;
        }
      }
      return {
        ...a,
        tenantSlug: u?.tenantSlug ?? null,
        tenantNombre,
      };
    }));
  }

  async findAll() {
    const repo = await this.getAdminRepo();
    const list = await repo.find();
    return this.enrichWithTenant(list);
  }
}
