import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { TenantMigrationRunner } from 'src/auth/infrastructure/persistence/tenants/tenant-migration.runner';
import { PersonaOrmEntity } from '../../persona/infrastructure/entities/persona.orm-entity';
import { UsuarioOrmEntity } from '../../usuario/infrastructure/entities/usuario.orm-entity';
import { CredencialOrmEntity } from '../../credencial/infrastructure/entities/credencial.orm-entity';
import { RolOrmEntity } from '../../rol/infrastructure/entities/rol.orm-entity';

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
    private readonly migrationRunner: TenantMigrationRunner,
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
      // Resolver tenant recién creado
      const tenant = await this.connectionManager.resolveTenant(slug);

      // Ejecutar migraciones de esquema de negocio
      await this.migrationRunner.runMigrations(tenant);

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

    const persona = await this.personaRepo.save({
      documento: adminDocumento,
      nombres: adminNombre,
      apellidos: adminApellido ?? null,
      correo: adminCorreo,
      estado: 'activo' as any,
    });

    const usuario = await this.usuarioRepo.save({
      persona_fk: persona.id_persona,
      aplicativo_fk: '11111111-1111-1111-1111-111111111111',
      tenant_slug: slug,
      activo: true,
    });

    await this.credencialRepo.save({
      login: adminCorreo,
      password: hashed,
      rol_fk: rolAdmin.id_rol,
      usuario_fk: usuario.id_usuario,
    });

    this.logger.log(`Administrador inicial creado para sede '${slug}': ${adminCorreo}`);
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
