import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioOrmEntity } from './../infrastructure/entities/usuario.orm-entity';
import { PersonaOrmEntity } from 'src/persona/infrastructure/entities/persona.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';

@Injectable()
export class UsuariosCGService {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @InjectRepository(PersonaOrmEntity)
    private readonly personaRepo: Repository<PersonaOrmEntity>,
    private readonly tenantConnectionManager: TenantConnectionManager,
  ) {}

  private async findUsuarioByDocumento(documento: string) {
    const persona = await this.personaRepo.findOne({ where: { documento } });
    if (!persona) {
      throw new NotFoundException(`Usuario con documento ${documento} no encontrado`);
    }
    const usuario = await this.usuarioRepo.findOne({
      where: { persona_fk: persona.id_persona },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con documento ${documento} no encontrado`);
    }
    return { usuario, persona };
  }

  async updateTenantByDocumento(documento: string, tenantSlug: string | null) {
    if (!documento) {
      throw new BadRequestException('El documento es requerido');
    }

    if (tenantSlug) {
      try {
        await this.tenantConnectionManager.resolveTenant(tenantSlug);
      } catch {
        throw new BadRequestException(`La sede '${tenantSlug}' no está registrada`);
      }
    }

    const { usuario } = await this.findUsuarioByDocumento(documento);
    usuario.tenant_slug = tenantSlug || null;
    await this.usuarioRepo.save(usuario);

    return {
      id: usuario.id_usuario,
      documento,
      tenantSlug: usuario.tenant_slug,
    };
  }

  async updateActivoByDocumento(documento: string, activo: boolean) {
    if (!documento) {
      throw new BadRequestException('El documento es requerido');
    }

    const { usuario } = await this.findUsuarioByDocumento(documento);
    usuario.activo = activo;
    await this.usuarioRepo.save(usuario);

    return {
      id: usuario.id_usuario,
      documento,
      activo: usuario.activo,
    };
  }

  async updateMunicipioByDocumento(documento: string, municipio: string | null) {
    if (!documento) {
      throw new BadRequestException('El documento es requerido');
    }

    const { persona } = await this.findUsuarioByDocumento(documento);
    persona.municipio_nombre = municipio || null;
    await this.personaRepo.save(persona);

    return {
      id: persona.id_persona,
      documento,
      municipio: persona.municipio_nombre,
    };
  }
}
