import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { compare, hash } from 'bcrypt';

import { PersonaOrmEntity } from 'src/persona/infrastructure/entities/persona.orm-entity';
import { InstructorOrmEntity } from 'src/persona/infrastructure/entities/instructor.orm-entity';
import { AdministradorOrmEntity } from 'src/persona/infrastructure/entities/administrador.orm-entity';
import { MatriculaOrmEntity } from 'src/matricula/infrastructure/entities/matricula.orm-entity';
import { CursoOrmEntity } from 'src/curso/infrastructure/entities/curso.orm-entity';
import { UsuarioOrmEntity } from 'src/usuario/infrastructure/entities/usuario.orm-entity';
import { CredencialOrmEntity } from 'src/credencial/infrastructure/entities/credencial.orm-entity';
import { RolOrmEntity } from 'src/rol/infrastructure/entities/rol.orm-entity';
import { ConfiguracionAppOrmEntity } from 'src/aplicativo/infrastructure/entities/configuracion-app.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';
import { UsuarioMaestro } from '../infrastructure/entities/usuario-maestro.orm-entity';

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
    @InjectRepository(UsuarioMaestro)
    private readonly usuarioMaestroRepo: Repository<UsuarioMaestro>,
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

    // El super administrador no pertenece a ninguna sede: no requiere tenant_slug.
    const esSuperAdmin = rolNombre === 'super_admin';

    if (!esSuperAdmin && !usuario.tenant_slug) {
      throw new UnauthorizedException('No tienes una sede asignada. Contacta al administrador.');
    }

    let tenantNombre: string | null = null;
    if (!esSuperAdmin) {
      try {
        const tenant = await this.tenantConnectionManager.resolveTenant(usuario.tenant_slug!);
        tenantNombre = tenant.nombre;
      } catch {
        throw new UnauthorizedException('La sede asignada al usuario no está registrada.');
      }
    }

    const valid = await compare(password, credencial.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const perfilId: string | null = esSuperAdmin
      ? persona.id_persona
      : await this.resolvePerfilId(usuario.tenant_slug!, rolNombre, persona.documento, persona.id_persona);

    const fichaId: string | null =
      !esSuperAdmin && rolNombre === 'aprendiz' ? await this.resolveFichaId(usuario.tenant_slug!, perfilId) : null;

    const payload: Record<string, unknown> = {
      sub: usuario.id_usuario,
      correo: persona.correo,
      documento: persona.documento,
      rol: rolNombre,
      perfilId,
      tenantSlug: esSuperAdmin ? null : usuario.tenant_slug,
      tenantNombre,
    };
    // Mantiene compatibilidad con SuperAdminGuard, que exige scope: 'platform' en el token.
    if (esSuperAdmin) {
      payload.scope = 'platform';
    }

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
        fichaId,
        tenantSlug: esSuperAdmin ? null : usuario.tenant_slug,
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
      fichaId,
    } = data;

    const documento = docOriginal || numDoc;

    if (rol === 'super_admin') {
      throw new BadRequestException('El rol super_admin no puede registrarse desde el login de sedes.');
    }

    const rolEntity = await this.rolRepo.findOne({ where: { nombre: rol } });
    if (!rolEntity) {
      throw new BadRequestException('Rol no válido');
    }

    const existsByCorreo = await this.findCredencialByIdentifier(correo);
    if (existsByCorreo) {
      throw new BadRequestException('Correo o documento ya registrado');
    }

    const existsByDocumento = await this.personaRepo.findOne({ where: { documento } });
    if (existsByDocumento) {
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

    // auth.usuario_maestro es lo que leen los listados de instructores/aprendices/administradores
    // (activo, municipio, tipoDoc, tenantSlug); sin esta fila esos datos nunca se pueden
    // mostrar ni actualizar para el usuario recién registrado.
    await this.usuarioMaestroRepo.save({
      correo,
      documento,
      password: hashed,
      rol,
      personaId: persona.id_persona,
      activo: true,
      tipoDoc: tipoDoc ?? null,
      tenantSlug: resolvedTenantSlug,
    });

    if (resolvedTenantSlug) {
      await this.createTenantProfile(resolvedTenantSlug, rol, {
        nombre,
        apellido,
        correo,
        documento,
        fichaId: rol === 'aprendiz' ? fichaId : undefined,
      });
    }

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

  /** Crea el perfil en la BD del tenant asignado. Para instructores/administradores crea
   *  la fila correspondiente; para aprendices, si se proporciona fichaId, crea la matrícula
   *  para que el aprendiz pueda ver la asistencia activa de su ficha al iniciar sesión. */
  private async createTenantProfile(
    tenantSlug: string,
    rol: string,
    data: { nombre: string; apellido?: string; correo: string; documento: string; fichaId?: string },
  ): Promise<PersonaOrmEntity> {
    const personaRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, PersonaOrmEntity);

    // Reutiliza la persona del tenant si ya existe (p. ej. datos legacy), de lo contrario la crea.
    let persona = await personaRepo.findOne({ where: { documento: data.documento } });
    if (persona) {
      persona.nombres = data.nombre;
      persona.apellidos = data.apellido ?? null;
      persona.correo = data.correo;
      persona.estado = 'activo' as any;
      persona = await personaRepo.save(persona);
    } else {
      persona = await personaRepo.save({
        documento: data.documento,
        nombres: data.nombre,
        apellidos: data.apellido ?? null,
        correo: data.correo,
        estado: 'activo' as any,
      });
    }

    if (rol === 'instructor') {
      const instructorRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, InstructorOrmEntity);
      await instructorRepo.save({ persona_fk: persona.id_persona });
    } else if (rol === 'admin') {
      const adminRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, AdministradorOrmEntity);
      await adminRepo.save({ persona_fk: persona.id_persona });
    } else if (rol === 'aprendiz' && data.fichaId) {
      const cursoRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, CursoOrmEntity);
      const curso = await cursoRepo.findOne({ where: { id_curso: data.fichaId } });
      if (!curso) {
        throw new BadRequestException('La ficha seleccionada no existe en esta sede.');
      }

      const matriculaRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, MatriculaOrmEntity);
      await matriculaRepo.save({
        persona_fk: persona.id_persona,
        curso_fk: curso.id_curso,
      });
    }

    return persona;
  }

  /** El JWT necesita el id del perfil en la BD del tenant (id_instructor/id_administrador/id_persona),
   *  que es el id que referencian horario_fk, curso_fk, matricula, etc. — no el id_persona de la BD
   *  compartida de login. Si no se encuentra (perfil no migrado aún), cae al id de persona compartido. */
  private async resolvePerfilId(
    tenantSlug: string,
    rol: string,
    documento: string,
    fallbackPersonaId: string,
  ): Promise<string> {
    try {
      const tenantPersonaRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, PersonaOrmEntity);
      const tenantPersona = await tenantPersonaRepo.findOne({ where: { documento } });
      if (!tenantPersona) return fallbackPersonaId;

      if (rol === 'instructor') {
        const instructorRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, InstructorOrmEntity);
        const instructor = await instructorRepo.findOne({ where: { persona_fk: tenantPersona.id_persona } });
        return instructor?.id_instructor ?? fallbackPersonaId;
      }
      if (rol === 'admin') {
        const adminRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, AdministradorOrmEntity);
        const admin = await adminRepo.findOne({ where: { persona_fk: tenantPersona.id_persona } });
        return admin?.id_administrador ?? fallbackPersonaId;
      }
      // aprendiz u otros roles: el id de persona del tenant es el perfil.
      return tenantPersona.id_persona;
    } catch {
      return fallbackPersonaId;
    }
  }

  /** Ficha (curso) en la que está matriculado el aprendiz, según la BD del tenant.
   *  perfilId ya es el id_persona del tenant (ver resolvePerfilId para rol aprendiz). */
  private async resolveFichaId(tenantSlug: string, perfilId: string | null): Promise<string | null> {
    if (!perfilId) return null;
    try {
      const matriculaRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, MatriculaOrmEntity);
      const matricula = await matriculaRepo.findOne({ where: { persona_fk: perfilId } });
      return matricula?.curso_fk ?? null;
    } catch {
      return null;
    }
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

    const perfilId = usuario.tenant_slug
      ? await this.resolvePerfilId(usuario.tenant_slug, rolNombre, persona.documento, persona.id_persona)
      : persona.id_persona;
    const fichaId =
      rolNombre === 'aprendiz' && usuario.tenant_slug ? await this.resolveFichaId(usuario.tenant_slug, perfilId) : null;

    return {
      id: usuario.id_usuario,
      perfilId,
      nombre: persona.nombres,
      apellido: persona.apellidos,
      correo: persona.correo,
      documento: persona.documento,
      rol: rolNombre,
      fichaId,
      tenantSlug: usuario.tenant_slug,
      tenantNombre,
    };
  }
}
