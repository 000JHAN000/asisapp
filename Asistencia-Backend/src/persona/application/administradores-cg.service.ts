import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdministradorOrmEntity } from 'src/persona/infrastructure/entities/administrador.orm-entity';
import { UsuarioMaestro } from 'src/auth/infrastructure/entities/usuario-maestro.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class AdministradoresCGService {
  constructor(
    @InjectRepository(UsuarioMaestro)
    private readonly usuarioRepo: Repository<UsuarioMaestro>,
    private readonly connectionManager: TenantConnectionManager,
  ) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new BadRequestException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private async getAdminRepo(): Promise<Repository<AdministradorOrmEntity>> {
    return this.connectionManager.getTenantRepository(this.tenantId, AdministradorOrmEntity);
  }

  private async enrichWithTenant(list: AdministradorOrmEntity[]) {
    const documentos = list.map((a) => a.persona?.documento).filter(Boolean);
    const usuarios = documentos.length
      ? await this.usuarioRepo.find({ where: { documento: In(documentos as string[]) } })
      : [];
    const map = new Map(usuarios.map((u) => [u.documento, u]));
    return Promise.all(
      list.map(async (a) => {
        const u = map.get(a.persona?.documento ?? '');
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
          id: a.id_administrador,
          nombre: a.persona?.nombres,
          apellido: a.persona?.apellidos,
          correo: a.persona?.correo,
          documento: a.persona?.documento,
          tenantSlug: u?.tenantSlug ?? null,
          tenantNombre,
        };
      }),
    );
  }

  async findAll() {
    const repo = await this.getAdminRepo();
    const list = await repo.find({ relations: ['persona'] });
    return this.enrichWithTenant(list);
  }
}
