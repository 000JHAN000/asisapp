import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { AuthCGService } from 'src/auth/application/auth-cg.service';
import { PersonaOrmEntity } from '../persona/infrastructure/entities/persona.orm-entity';

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutos
const PENDING_LOGIN_TTL_MS = 5 * 60 * 1000; // 5 minutos para completar correo + contraseña

export interface BotSession {
  perfilId: string;
  tenantSlug: string;
  documento: string;
  nombre: string;
  apellido: string | null;
}

interface PendingLogin {
  correo: string;
}

/** Sesión conversacional del bot de WhatsApp: identifica a quién pertenece un número de
 *  teléfono (documento + sede) buscando en todas las sedes, y guarda esa identidad en
 *  caché (Redis) por un tiempo limitado para que las siguientes preguntas no requieran
 *  volver a pedir el documento.
 *
 *  Usa un cliente ioredis propio (en vez de CACHE_MANAGER) porque la combinación
 *  cache-manager@7 + cache-manager-ioredis@2 configurada globalmente en AppModule
 *  no persiste correctamente entre llamadas (incompatibilidad de versiones: el store
 *  ioredis fue escrito para la API vieja de cache-manager v3/v4). El bot necesita que
 *  el estado "correo pendiente" sí sobreviva entre el mensaje 1 (correo) y el mensaje 2
 *  (contraseña), así que se maneja aquí con Redis directo. */
@Injectable()
export class BotService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    private readonly config: ConfigService,
    private readonly connectionManager: TenantConnectionManager,
    private readonly authCGService: AuthCGService,
  ) {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST'),
      port: this.config.get<number>('REDIS_PORT'),
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  private sessionKey(telefono: string): string {
    return `bot:session:${telefono}`;
  }

  private pendingLoginKey(telefono: string): string {
    return `bot:pending-login:${telefono}`;
  }

  async obtenerSesion(telefono: string): Promise<BotSession | null> {
    const raw = await this.redis.get(this.sessionKey(telefono));
    return raw ? (JSON.parse(raw) as BotSession) : null;
  }

  private async obtenerCorreoPendiente(telefono: string): Promise<PendingLogin | null> {
    const raw = await this.redis.get(this.pendingLoginKey(telefono));
    return raw ? (JSON.parse(raw) as PendingLogin) : null;
  }

  /** Estado combinado que necesita el flujo conversacional del bot: si hay sesión activa,
   *  o si ya se recibió el correo y solo falta la contraseña. */
  async obtenerEstado(
    telefono: string,
  ): Promise<{ activa: boolean; pendienteCorreo: boolean } & Partial<BotSession>> {
    const session = await this.obtenerSesion(telefono);
    if (session) {
      return { activa: true, pendienteCorreo: false, ...session };
    }
    const pending = await this.obtenerCorreoPendiente(telefono);
    return { activa: false, pendienteCorreo: !!pending };
  }

  /** Paso 1 del login conversacional: guarda el correo dado y espera la contraseña
   *  en el siguiente mensaje. */
  async guardarCorreoPendiente(telefono: string, correo: string): Promise<{ ok: boolean }> {
    const pending: PendingLogin = { correo: correo.trim() };
    await this.redis.set(this.pendingLoginKey(telefono), JSON.stringify(pending), 'PX', PENDING_LOGIN_TTL_MS);
    return { ok: true };
  }

  /** Paso 2 del login conversacional: valida correo + contraseña exactamente como el
   *  login web (AuthCGService.login), y si es correcto arma la sesión del bot con el
   *  mismo perfilId/tenantSlug que usaría la sesión web. */
  async validarPassword(
    telefono: string,
    password: string,
  ): Promise<{ encontrado: boolean; nombre?: string; apellido?: string | null }> {
    const pending = await this.obtenerCorreoPendiente(telefono);
    if (!pending) {
      return { encontrado: false };
    }

    try {
      const { user } = await this.authCGService.login(pending.correo, password);
      if (!user.tenantSlug || !user.perfilId) {
        // Roles sin sede (p. ej. super_admin) no tienen datos de asistencia/horario que
        // consultar por WhatsApp; se trata como credenciales no utilizables aquí.
        await this.redis.del(this.pendingLoginKey(telefono));
        return { encontrado: false };
      }

      const session: BotSession = {
        perfilId: user.perfilId,
        tenantSlug: user.tenantSlug,
        documento: user.documento,
        nombre: user.nombre,
        apellido: user.apellido,
      };
      await this.redis.set(this.sessionKey(telefono), JSON.stringify(session), 'PX', SESSION_TTL_MS);
      await this.redis.del(this.pendingLoginKey(telefono));
      return { encontrado: true, nombre: user.nombre, apellido: user.apellido };
    } catch {
      // Contraseña incorrecta: se limpia el estado pendiente para que el usuario
      // reinicie desde el correo en vez de quedar en un reintento ambiguo.
      await this.redis.del(this.pendingLoginKey(telefono));
      return { encontrado: false };
    }
  }

  async iniciarSesion(telefono: string, documento: string): Promise<{ encontrado: boolean; nombre?: string; apellido?: string | null }> {
    const tenants = await this.connectionManager.findAll();

    for (const tenant of tenants) {
      if (!tenant.activo) continue;
      try {
        const personaRepo = await this.connectionManager.getTenantRepository(tenant.slug, PersonaOrmEntity);
        const persona = await personaRepo.findOne({ where: { documento } });
        if (persona) {
          const session: BotSession = {
            perfilId: persona.id_persona,
            tenantSlug: tenant.slug,
            documento: persona.documento,
            nombre: persona.nombres,
            apellido: persona.apellidos,
          };
          await this.redis.set(this.sessionKey(telefono), JSON.stringify(session), 'PX', SESSION_TTL_MS);
          return { encontrado: true, nombre: persona.nombres, apellido: persona.apellidos };
        }
      } catch {
        continue;
      }
    }

    return { encontrado: false };
  }
}
