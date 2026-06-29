import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioCG } from '../entities/usuario-cg.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';

@Injectable()
export class UsuariosCGService {
  constructor(
    @InjectRepository(UsuarioCG)
    private readonly usuarioRepo: Repository<UsuarioCG>,
    private readonly tenantConnectionManager: TenantConnectionManager,
  ) {}

  async updateTenantByDocumento(documento: string, tenantSlug: string | null) {
    if (!documento) {
      throw new BadRequestException('El documento es requerido');
    }

    if (tenantSlug) {
      // Validar que la sede exista en el catálogo
      try {
        await this.tenantConnectionManager.resolveTenant(tenantSlug);
      } catch {
        throw new BadRequestException(`La sede '${tenantSlug}' no está registrada`);
      }
    }

    const usuario = await this.usuarioRepo.findOne({ where: { documento } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con documento ${documento} no encontrado`);
    }

    usuario.tenantSlug = tenantSlug || null;
    await this.usuarioRepo.save(usuario);

    return {
      id: usuario.id,
      documento: usuario.documento,
      tenantSlug: usuario.tenantSlug,
    };
  }
}
