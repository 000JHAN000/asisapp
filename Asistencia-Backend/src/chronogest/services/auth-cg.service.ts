import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcrypt';

import { UsuarioCG } from '../entities/usuario-cg.entity';
import { InstructorCG } from '../entities/instructor-cg.entity';
import { AprendizCG } from '../entities/aprendiz-cg.entity';
import { AdminCG } from '../entities/admin-cg.entity';
import { ConfiguracionApp } from '../entities/configuracion-app.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class AuthCGService {
  private tokenBlacklist = new Set<string>();

  constructor(
    @InjectRepository(UsuarioCG)
    private readonly usuarioRepo: Repository<UsuarioCG>,
    private readonly jwtService: JwtService,
    private readonly tenantConnectionManager: TenantConnectionManager,
  ) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private async getInstructorRepo(tenantId?: string | null) {
    return this.tenantConnectionManager.getTenantRepository(tenantId ?? this.tenantId, InstructorCG);
  }

  private async getAprendizRepo(tenantId?: string | null) {
    return this.tenantConnectionManager.getTenantRepository(tenantId ?? this.tenantId, AprendizCG);
  }

  private async getAdminRepo(tenantId?: string | null) {
    return this.tenantConnectionManager.getTenantRepository(tenantId ?? this.tenantId, AdminCG);
  }

  private async getConfigRepo(tenantId?: string | null) {
    return this.tenantConnectionManager.getTenantRepository(tenantId ?? this.tenantId, ConfiguracionApp);
  }

  async login(identifier: string, password: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: [{ correo: identifier }, { documento: identifier }],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    if (usuario.rol === 'super_admin') {
      throw new UnauthorizedException('Los super administradores deben usar el panel de plataforma.');
    }

    if (!usuario.tenantSlug) {
      throw new UnauthorizedException('No tienes una sede asignada. Contacta al administrador.');
    }

    let tenantNombre: string;
    try {
      const tenant = await this.tenantConnectionManager.resolveTenant(usuario.tenantSlug);
      tenantNombre = tenant.nombre;
    } catch {
      throw new UnauthorizedException('La sede asignada al usuario no está registrada.');
    }

    const valid = await compare(password, usuario.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    let perfil: any;
    if (usuario.rol === 'instructor') {
      const repo = await this.getInstructorRepo(usuario.tenantSlug);
      perfil = await repo.findOne({ where: { documento: usuario.documento } });
    } else if (usuario.rol === 'aprendiz') {
      const repo = await this.getAprendizRepo(usuario.tenantSlug);
      perfil = await repo.findOne({ where: { documento: usuario.documento } });
    } else if (usuario.rol === 'admin') {
      const repo = await this.getAdminRepo(usuario.tenantSlug);
      perfil = await repo.findOne({ where: { documento: usuario.documento } });
    }

    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      documento: usuario.documento,
      rol: usuario.rol,
      perfilId: perfil?.id ?? null,
      tenantSlug: usuario.tenantSlug,
      tenantNombre,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'default-secret',
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
    });

    return {
      access_token,
      user: {
        id: usuario.id,
        perfilId: perfil?.id ?? null,
        nombre: perfil?.nombre ?? null,
        apellido: perfil?.apellido ?? null,
        correo: usuario.correo,
        documento: usuario.documento,
        rol: usuario.rol,
        fichaId: perfil?.fichaId ?? null,
        tenantSlug: usuario.tenantSlug,
        tenantNombre,
      },
    };
  }

  logout(token: string) {
    if (token) {
      this.tokenBlacklist.add(token);
    }
    return { success: true };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklist.has(token);
  }

  async register(data: any) {
    const {
      nombre,
      apellido,
      correo,
      documento: docOriginal,
      numDoc,
      password,
      rol,
      fichaId,
      esLider,
      areaLiderada,
      esTransversal,
      tenantSlug,
    } = data;

    const documento = docOriginal || numDoc;

    if (rol === 'super_admin') {
      throw new BadRequestException('El rol super_admin no puede registrarse desde el login de sedes.');
    }

    const exists = await this.usuarioRepo.findOne({
      where: [{ correo }, { documento }],
    });

    if (exists) {
      throw new BadRequestException('Correo o documento ya registrado');
    }

    let resolvedTenantSlug: string | null = null;
    if (tenantSlug) {
      try {
        await this.tenantConnectionManager.resolveTenant(tenantSlug);
        resolvedTenantSlug = tenantSlug;
      } catch {
        throw new BadRequestException('La sede seleccionada no está registrada.');
      }
    }

    const hashed = await hash(password, 10);

    const usuario = await this.usuarioRepo.save({
      correo,
      documento,
      password: hashed,
      rol,
      activo: true,
      tenantSlug: resolvedTenantSlug,
    });

    // El perfil se crea en la BD del tenant asignado
    if (resolvedTenantSlug) {
      if (rol === 'instructor') {
        const repo = await this.tenantConnectionManager.getTenantRepository(resolvedTenantSlug, InstructorCG);
        await repo.save({
          nombre,
          apellido,
          correo,
          documento,
          esLider: esLider ?? false,
          areaLiderada,
          esTransversal: esTransversal ?? false,
        });
      } else if (rol === 'aprendiz') {
        const repo = await this.tenantConnectionManager.getTenantRepository(resolvedTenantSlug, AprendizCG);
        await repo.save({
          nombre,
          apellido,
          correo,
          documento,
          fichaId,
        });
      } else if (rol === 'admin') {
        const repo = await this.tenantConnectionManager.getTenantRepository(resolvedTenantSlug, AdminCG);
        await repo.save({
          nombre,
          apellido,
          correo,
          documento,
        });
      }
    }

    return {
      success: true,
      user: {
        id: usuario.id,
        correo: usuario.correo,
        documento: usuario.documento,
        rol: usuario.rol,
        tenantSlug: usuario.tenantSlug,
      },
    };
  }

  async verifyPin(pin: string) {
    const configRepo = await this.getConfigRepo();
    const config = await configRepo.findOne({ where: {} });
    return { valid: config?.pinRegistro === pin };
  }

  forgotPassword(_data: any) {
    return { success: true };
  }

  verifyResetCode(_data: any) {
    return { success: true };
  }

  resetPassword(_data: any) {
    return { success: true };
  }

  async me(userId: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: userId } });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    let perfil: any;
    if (usuario.rol === 'instructor') {
      const repo = await this.getInstructorRepo(usuario.tenantSlug);
      perfil = await repo.findOne({ where: { documento: usuario.documento } });
    } else if (usuario.rol === 'aprendiz') {
      const repo = await this.getAprendizRepo(usuario.tenantSlug);
      perfil = await repo.findOne({ where: { documento: usuario.documento } });
    } else if (usuario.rol === 'admin') {
      const repo = await this.getAdminRepo(usuario.tenantSlug);
      perfil = await repo.findOne({ where: { documento: usuario.documento } });
    }

    let tenantNombre: string | null = null;
    if (usuario.tenantSlug) {
      try {
        const tenant = await this.tenantConnectionManager.resolveTenant(usuario.tenantSlug);
        tenantNombre = tenant.nombre;
      } catch {
        tenantNombre = null;
      }
    }

    return {
      id: usuario.id,
      perfilId: perfil?.id ?? null,
      nombre: perfil?.nombre ?? null,
      apellido: perfil?.apellido ?? null,
      correo: usuario.correo,
      documento: usuario.documento,
      rol: usuario.rol,
      fichaId: perfil?.fichaId ?? null,
      tenantSlug: usuario.tenantSlug,
      tenantNombre,
    };
  }
}
