import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InstructorOrmEntity } from 'src/persona/infrastructure/entities/instructor.orm-entity';
import { UsuarioMaestro } from 'src/auth/infrastructure/entities/usuario-maestro.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class InstructoresCGService {
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

  private async getInstructorRepo(): Promise<Repository<InstructorOrmEntity>> {
    return this.connectionManager.getTenantRepository(this.tenantId, InstructorOrmEntity);
  }

  private async enrichWithTenant(list: InstructorOrmEntity[]) {
    const documentos = list.map((i) => i.persona?.documento).filter(Boolean);
    const usuarios = documentos.length
      ? await this.usuarioRepo.find({ where: { documento: In(documentos as string[]) } })
      : [];
    const map = new Map(usuarios.map((u) => [u.documento, u]));
    return Promise.all(
      list.map(async (i) => {
        const u = map.get(i.persona?.documento ?? '');
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
          id: i.id_instructor,
          nombre: i.persona?.nombres,
          apellido: i.persona?.apellidos,
          correo: i.persona?.correo,
          documento: i.persona?.documento,
          esLider: i.esLider,
          areaLiderada: i.areaLiderada,
          esTransversal: i.esTransversal,
          tipoDoc: u?.tipoDoc ?? null,
          activo: u?.activo ?? true,
          municipio: u?.municipio ?? null,
          tenantSlug: u?.tenantSlug ?? null,
          tenantNombre,
        };
      }),
    );
  }

  async findAll() {
    const repo = await this.getInstructorRepo();
    const list = await repo.find({ relations: ['persona'] });
    return this.enrichWithTenant(list);
  }

  async update(id: string, data: any) {
    const repo = await this.getInstructorRepo();
    await repo.update(
      { id_instructor: id },
      {
        esLider: data.esLider,
        areaLiderada: data.areaLiderada,
        esTransversal: data.esTransversal,
      },
    );
    return repo.findOne({ where: { id_instructor: id }, relations: ['persona'] });
  }

  async setLider(id: string, esLider: boolean, areaLiderada?: string) {
    const repo = await this.getInstructorRepo();
    await repo.update(
      { id_instructor: id },
      {
        esLider,
        areaLiderada: esLider ? areaLiderada : undefined,
      },
    );
    return repo.findOne({ where: { id_instructor: id }, relations: ['persona'] });
  }

  async setTransversal(id: string, esTransversal: boolean) {
    const repo = await this.getInstructorRepo();
    await repo.update({ id_instructor: id }, { esTransversal });
    return repo.findOne({ where: { id_instructor: id }, relations: ['persona'] });
  }

  async getStats() {
    const repo = await this.getInstructorRepo();
    const total = await repo.count();
    const lideres = await repo.count({ where: { esLider: true } });
    const transversales = await repo.count({ where: { esTransversal: true } });
    return { total, lideres, transversales };
  }
}
