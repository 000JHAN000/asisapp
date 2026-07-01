import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { compare, hash } from 'bcrypt';

import { PersonaOrmEntity } from 'src/persona/infrastructure/entities/persona.orm-entity';
import { UsuarioOrmEntity } from 'src/usuario/infrastructure/entities/usuario.orm-entity';
import { CredencialOrmEntity } from 'src/credencial/infrastructure/entities/credencial.orm-entity';
import { RolOrmEntity } from 'src/rol/infrastructure/entities/rol.orm-entity';
import { ConfiguracionAppOrmEntity } from 'src/aplicativo/infrastructure/entities/configuracion-app.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class AuthCGService {
  private tokenBlacklist = new Set<string>();

  constructor(
    @InjectRepository(CredencialOrmEntity)
    private readonly credencialRepo: Repository<CredencialOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @InjectRepository(PersonaOrmEntity)
    private readonly personaRepo: Repository<PersonaOrmEntity>,
    @InjectRepository(RolOrmEntity)
    private readonly rolRepo: Repository<RolOrmEntity>,
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

  private async getConfigRepo(tenantId?: string | null) {
    return this.tenantConnectionManager.getTenantRepository(tenantId ?? this.tenantId, ConfiguracionAppOrmEntity);
  }

  private async findCredencialByIdentifier(identifier: string) {
    // Primero intentar por login (correo)
    const byLogin = await this.credencialRepo.findOne({
      where: { login: identifier },
      relations: ['usuario', 'usuario.persona', 'rol'],
    });
    if (byLogin) return byLogin;

    // Luego por documento de persona
    const persona = await this.personaRepo.findOne({ where: { documento: identifier } });
    if (!persona) return null;

    const usuario = await this.usuarioRepo.findOne({
      where: { persona_fk: persona.id_persona },
      relations: ['persona'],
    });
    if (!usuario) return null;

    return this.credencialRepo.findOne({
      where: { usuario_fk: usuario.id_usuario },
      relations: ['usuario', 'usuario.persona', 'rol'],
    });
  }

  async login(identifier: string, password: string) {
    const credencial = await this.findCredencialByIdentifier(identifier);
    if (!credencial || !credencial.usuario || !credencial.usuario.persona) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const usuario = credencial.usuario;
    const persona = usuario.persona;
    const rolNombre = credencial.rol?.nombre ?? '';

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    if (rolNombre === 'super_admin') {
      throw new UnauthorizedException('Los super administradores deben usar el panel de plataforma.');
    }

    if (!usuario.tenant_slug) {
      throw new UnauthorizedException('No tienes una sede asignada. Contacta al administrador.');
    }

    let tenantNombre: string;
    try {
      const tenant = await this.tenantConnectionManager.resolveTenant(usuario.tenant_slug);
      tenantNombre = tenant.nombre;
    } catch {
      throw new UnauthorizedException('La sede asignada al usuario no está registrada.');
    }

    const valid = await compare(password, credencial.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // TODO: En fases 2-3, perfilId debe apuntar al instructor/aprendiz/admin legacy del tenant.
    const perfilId: string | null = persona.id_persona;

    const payload = {
      sub: usuario.id_usuario,
      correo: persona.correo,
      documento: persona.documento,
      rol: rolNombre,
      perfilId,
      tenantSlug: usuario.tenant_slug,
      tenantNombre,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'default-secret',
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
    });

    return {
      access_token,
      user: {
        id: usuario.id_usuario,
        perfilId,
        nombre: persona.nombres,
        apellido: persona.apellidos,
        correo: persona.correo,
        documento: persona.documento,
        rol: rolNombre,
        fichaId: null,
        tenantSlug: usuario.tenant_slug,
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
      tipoDoc,
      password,
      rol,
      tenantSlug,
    } = data;

    const documento = docOriginal || numDoc;

    if (rol === 'super_admin') {
      throw new BadRequestException('El rol super_admin no puede registrarse desde el login de sedes.');
    }

    const rolEntity = await this.rolRepo.findOne({ where: { nombre: rol } });
    if (!rolEntity) {
      throw new BadRequestException('Rol no válido');
    }

    const exists = await this.findCredencialByIdentifier(correo);
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

    const persona = await this.personaRepo.save({
      nombres: nombre,
      apellidos: apellido,
      correo,
      documento,
      tipo_doc: tipoDoc ?? null,
      estado: 'activo' as any,
    });

    const usuario = await this.usuarioRepo.save({
      persona_fk: persona.id_persona,
      aplicativo_fk: '11111111-1111-1111-1111-111111111111',
      tenant_slug: resolvedTenantSlug,
      activo: true,
    });

    await this.credencialRepo.save({
      login: correo,
      password: hashed,
      rol_fk: rolEntity.id_rol,
      usuario_fk: usuario.id_usuario,
    });

    // TODO: En fases 2-3, crear el perfil específico (instructor/aprendiz/admin) en la BD del tenant.

    return {
      success: true,
      user: {
        id: usuario.id_usuario,
        correo: persona.correo,
        documento: persona.documento,
        rol,
        tenantSlug: usuario.tenant_slug,
      },
    };
  }

  async verifyPin(pin: string) {
    const configRepo = await this.getConfigRepo();
    const config = await configRepo.findOne({ where: {} });
    return { valid: config?.pin_registro === pin };
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
    const usuario = await this.usuarioRepo.findOne({
      where: { id_usuario: userId },
      relations: ['persona', 'credenciales', 'credenciales.rol'],
    });
    if (!usuario || !usuario.persona) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const persona = usuario.persona;
    const credencial = usuario.credenciales?.[0];
    const rolNombre = credencial?.rol?.nombre ?? '';

    let tenantNombre: string | null = null;
    if (usuario.tenant_slug) {
      try {
        const tenant = await this.tenantConnectionManager.resolveTenant(usuario.tenant_slug);
        tenantNombre = tenant.nombre;
      } catch {
        tenantNombre = null;
      }
    }

    return {
      id: usuario.id_usuario,
      perfilId: persona.id_persona,
      nombre: persona.nombres,
      apellido: persona.apellidos,
      correo: persona.correo,
      documento: persona.documento,
      rol: rolNombre,
      fichaId: null,
      tenantSlug: usuario.tenant_slug,
      tenantNombre,
    };
  }
}
