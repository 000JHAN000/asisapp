import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioMaestro } from 'src/auth/infrastructure/entities/usuario-maestro.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';

@Injectable()
export class UsuariosCGService {
  constructor(
    // El listado de instructores/aprendices (AprendicesCGService/InstructoresCGService)
    // lee activo/municipio/tenantSlug desde auth.usuario_maestro, así que las
    // actualizaciones deben escribir ahí también — de lo contrario el cambio se
    // "revierte" en la siguiente carga porque nunca se guardó donde se lee.
    @InjectRepository(UsuarioMaestro)
    private readonly usuarioMaestroRepo: Repository<UsuarioMaestro>,
    private readonly tenantConnectionManager: TenantConnectionManager,
  ) {}

  private async findUsuarioMaestro(documento: string) {
    const usuario = await this.usuarioMaestroRepo.findOne({ where: { documento } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con documento ${documento} no encontrado`);
    }
    return usuario;
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

    const usuario = await this.findUsuarioMaestro(documento);
    usuario.tenantSlug = tenantSlug || null;
    await this.usuarioMaestroRepo.save(usuario);

    return {
      id: usuario.id,
      documento,
      tenantSlug: usuario.tenantSlug,
    };
  }

  async updateActivoByDocumento(documento: string, activo: boolean) {
    if (!documento) {
      throw new BadRequestException('El documento es requerido');
    }

    const usuario = await this.findUsuarioMaestro(documento);
    usuario.activo = activo;
    await this.usuarioMaestroRepo.save(usuario);

    return {
      id: usuario.id,
      documento,
      activo: usuario.activo,
    };
  }

  async updateMunicipioByDocumento(documento: string, municipio: string | null) {
    if (!documento) {
      throw new BadRequestException('El documento es requerido');
    }

    const usuario = await this.findUsuarioMaestro(documento);
    usuario.municipio = municipio || null;
    await this.usuarioMaestroRepo.save(usuario);

    return {
      id: usuario.id,
      documento,
      municipio: usuario.municipio,
    };
  }
}
