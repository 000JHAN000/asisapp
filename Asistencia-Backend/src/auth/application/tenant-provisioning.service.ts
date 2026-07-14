import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { PersonaOrmEntity } from '../../persona/infrastructure/entities/persona.orm-entity';
import { UsuarioOrmEntity } from '../../usuario/infrastructure/entities/usuario.orm-entity';
import { CredencialOrmEntity } from '../../credencial/infrastructure/entities/credencial.orm-entity';
import { RolOrmEntity } from '../../rol/infrastructure/entities/rol.orm-entity';
import { DepartamentoOrmEntity } from '../../departamento/infrastructure/entities/departamento.orm-entity';
import { MunicipioOrmEntity } from '../../municipio/infrastructure/entities/municipio.orm-entity';
import { CentroFormacionOrmEntity } from '../../centro-formacion/infrastructure/entities/centro-formacion.orm-entity';
import { SedeOrmEntity } from '../../sede/infrastructure/entities/sede.orm-entity';
import { UsuarioMaestro } from '../infrastructure/entities/usuario-maestro.orm-entity';

export interface CreateTenantInput {
  slug: string;
  nombre: string;
  dbName: string;
  dbHost?: string;
  dbPort?: number;
  adminDocumento?: string;
  adminCorreo?: string;
  adminNombre?: string;
  adminApellido?: string;
  adminPassword?: string;
}

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    @InjectDataSource()
    private readonly masterDataSource: DataSource,
    private readonly connectionManager: TenantConnectionManager,
    @InjectRepository(PersonaOrmEntity)
    private readonly personaRepo: Repository<PersonaOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @InjectRepository(CredencialOrmEntity)
    private readonly credencialRepo: Repository<CredencialOrmEntity>,
    @InjectRepository(RolOrmEntity)
    private readonly rolRepo: Repository<RolOrmEntity>,
  ) {}

  async createTenant(input: CreateTenantInput): Promise<{ id: string; slug: string }> {
    const { slug, nombre, dbName } = input;
    const dbHost = input.dbHost ?? process.env.DB_HOST ?? 'db';
    const dbPort = input.dbPort ?? parseInt(process.env.DB_PORT ?? '5432', 10);

    // Validar slug único
    const existingSlug = await this.masterDataSource.query(
      'SELECT id FROM auth.tenants WHERE slug = $1',
      [slug],
    );
    if (existingSlug?.length > 0) {
      throw new BadRequestException(`La sede '${slug}' ya existe`);
    }

    // Validar dbName único
    const existingDb = await this.masterDataSource.query(
      'SELECT id FROM auth.tenants WHERE db_name = $1',
      [dbName],
    );
    if (existingDb?.length > 0) {
      throw new BadRequestException(`La base de datos '${dbName}' ya está en uso`);
    }

    // Crear base de datos física
    await this.createPhysicalDatabase(dbName);

    // Insertar registro en catálogo maestro
    const tenantRows = await this.masterDataSource.query<{ id: string }[]>(
      `INSERT INTO auth.tenants (slug, nombre, db_name, db_host, db_port, activo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [slug, nombre, dbName, dbHost, dbPort],
    );

    const tenantId = tenantRows[0].id;

    try {
      // Conectar y sincronizar el esquema de negocio (misma vía que usan las sedes existentes:
      // TENANT_BUSINESS_ENTITIES + synchronize, no migraciones — esas quedaron obsoletas y creaban
      // el esquema cg_* anterior a la migración a legacy conectado).
      await this.connectionManager.getTenantDataSource(slug);

      // Cada tenant representa exactamente una sede física: se crea automáticamente
      // su propio Centro de Formación + Sede, para que el administrador no tenga
      // que (ni pueda) elegir entre sedes de otros tenants al crear áreas/programas.
      await this.seedSedePropia(slug, nombre);

      // Crear administrador inicial si se proporcionaron datos
      await this.createInitialAdmin(slug, input);

      this.logger.log(`Sede '${slug}' provisionada exitosamente`);

      return { id: tenantId, slug };
    } catch (error) {
      this.logger.error(`Error provisionando sede '${slug}': ${error.message}`, error.stack);
      // Rollback: eliminar registro de catálogo
      await this.masterDataSource.query('DELETE FROM auth.tenants WHERE id = $1', [tenantId]);
      // Nota: no eliminamos la BD física automáticamente para permitir diagnóstico
      throw error;
    }
  }

  async toggleTenantStatus(slug: string, activo: boolean): Promise<void> {
    const result = await this.masterDataSource.query(
      'UPDATE auth.tenants SET activo = $1 WHERE slug = $2 RETURNING id',
      [activo, slug],
    );

    if (!result || result.length === 0) {
      throw new BadRequestException(`La sede '${slug}' no existe`);
    }
  }

  private async createInitialAdmin(slug: string, input: CreateTenantInput): Promise<void> {
    const { adminDocumento, adminCorreo, adminNombre, adminApellido, adminPassword } = input;
    if (!adminDocumento || !adminCorreo || !adminNombre || !adminPassword) {
      return;
    }

    // Verificar duplicados a nivel de plataforma en el modelo legacy conectado
    const existingPersona = await this.personaRepo.findOne({
      where: [{ documento: adminDocumento }, { correo: adminCorreo }],
    });
    if (existingPersona) {
      throw new BadRequestException('El documento o correo del administrador ya está registrado');
    }

    const rolAdmin = await this.rolRepo.findOne({ where: { nombre: 'admin' } });
    if (!rolAdmin) {
      throw new BadRequestException('Rol admin no encontrado en el catálogo');
    }

    const hashed = await hash(adminPassword, 10);

    // Persona + usuario + credencial se crean en una sola transacción: si cualquiera
    // de los tres pasos falla, no debe quedar un registro huérfano (p. ej. una persona
    // sin usuario/credencial) que luego bloquee reintentos con el mismo documento/correo.
    await this.masterDataSource.transaction(async (manager) => {
      const persona = await manager.save(PersonaOrmEntity, {
        documento: adminDocumento,
        nombres: adminNombre,
        apellidos: adminApellido ?? null,
        correo: adminCorreo,
        estado: 'activo' as any,
      });

      const usuario = await manager.save(UsuarioOrmEntity, {
        persona_fk: persona.id_persona,
        aplicativo_fk: '11111111-1111-1111-1111-111111111111',
        tenant_slug: slug,
        activo: true,
      });

      await manager.save(CredencialOrmEntity, {
        login: adminCorreo,
        password: hashed,
        rol_fk: rolAdmin.id_rol,
        usuario_fk: usuario.id_usuario,
      });

      // auth.usuario_maestro es lo que leen los listados de usuarios (activo, municipio,
      // tenantSlug); sin esta fila el administrador inicial no aparecería correctamente ahí.
      await manager.save(UsuarioMaestro, {
        correo: adminCorreo,
        documento: adminDocumento,
        password: hashed,
        rol: 'admin',
        personaId: persona.id_persona,
        activo: true,
        tenantSlug: slug,
      });
    });

    this.logger.log(`Administrador inicial creado para sede '${slug}': ${adminCorreo}`);
  }

  /** Crea el Centro de Formación + Sede propios del tenant, si no existen aún.
   *  Un tenant = una sede: no tiene sentido pedirle al administrador que elija
   *  una sede entre varias, porque en su base de datos nunca habrá más de una.
   *  Departamento/Municipio locales son solo un placeholder para satisfacer las
   *  llaves foráneas (la información geográfica real se gestiona en el catálogo
   *  compartido vía /api/formativo/departamentos y /municipios). */
  private async seedSedePropia(slug: string, nombre: string): Promise<void> {
    const centroRepo = await this.connectionManager.getTenantRepository(slug, CentroFormacionOrmEntity);
    const existente = await centroRepo.findOne({ where: {} });
    if (existente) return; // ya provisionada (p. ej. reintento sobre un tenant existente)

    const departamentoRepo = await this.connectionManager.getTenantRepository(slug, DepartamentoOrmEntity);
    const municipioRepo = await this.connectionManager.getTenantRepository(slug, MunicipioOrmEntity);

    let departamento = await departamentoRepo.findOne({ where: {} });
    if (!departamento) {
      departamento = await departamentoRepo.save({ nombre: 'General' });
    }

    let municipio = await municipioRepo.findOne({ where: {} });
    if (!municipio) {
      municipio = await municipioRepo.save({ nombre: 'General', departamento_fk: departamento.id_departamento });
    }

    const centro = await centroRepo.save({ nombre, municipio_fk: municipio.id_municipio });

    const sedeRepo = await this.connectionManager.getTenantRepository(slug, SedeOrmEntity);
    await sedeRepo.save({ nombre: 'Sede Principal', centro_formacion_fk: centro.id_centro });

    this.logger.log(`Sede propia creada para el tenant '${slug}'`);
  }

  private async createPhysicalDatabase(dbName: string): Promise<void> {
    // PostgreSQL no permite parámetros en CREATE DATABASE, sanitizamos el identificador
    const safeDbName = dbName.replace(/[^a-zA-Z0-9_]/g, '');
    if (!safeDbName) {
      throw new BadRequestException('Nombre de base de datos inválido');
    }

    const exists = await this.masterDataSource.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [safeDbName],
    );

    if (exists?.length > 0) {
      this.logger.warn(`La base de datos '${safeDbName}' ya existe; se usará tal cual`);
      return;
    }

    await this.masterDataSource.query(`CREATE DATABASE "${safeDbName}"`);
    this.logger.log(`Base de datos '${safeDbName}' creada`);
  }
}
