import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InstructorCG } from '../entities/instructor-cg.entity';
import { UsuarioCG } from '../entities/usuario-cg.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class InstructoresService {
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

  private async getInstructorRepo(): Promise<Repository<InstructorCG>> {
    return this.connectionManager.getTenantRepository(this.tenantId, InstructorCG);
  }

  private async enrichWithTenant(list: InstructorCG[]) {
    const documentos = list.map(i => i.documento);
    const usuarios = documentos.length
      ? await this.usuarioRepo.find({ where: { documento: In(documentos) } })
      : [];
    const map = new Map(usuarios.map(u => [u.documento, u]));
    return Promise.all(list.map(async i => {
      const u = map.get(i.documento);
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
        ...i,
        tenantSlug: u?.tenantSlug ?? null,
        tenantNombre,
      };
    }));
  }

  async findAll() {
    const repo = await this.getInstructorRepo();
    const list = await repo.find();
    return this.enrichWithTenant(list);
  }

  async update(id: string, data: any) {
    const repo = await this.getInstructorRepo();
    await repo.update(id, data);
    return repo.findOne({ where: { id } });
  }

  async setLider(id: string, esLider: boolean, areaLiderada?: string) {
    const repo = await this.getInstructorRepo();
    await repo.update(id, {
      esLider,
      areaLiderada: esLider ? areaLiderada : undefined,
    });
    return repo.findOne({ where: { id } });
  }

  async setTransversal(id: string, esTransversal: boolean) {
    const repo = await this.getInstructorRepo();
    await repo.update(id, { esTransversal });
    return repo.findOne({ where: { id } });
  }

  async getStats() {
    const repo = await this.getInstructorRepo();
    const total = await repo.count();
    const lideres = await repo.count({ where: { esLider: true } });
    const transversales = await repo.count({ where: { esTransversal: true } });
    return { total, lideres, transversales };
  }
}
