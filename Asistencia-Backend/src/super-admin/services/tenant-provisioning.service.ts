import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { hash } from 'bcrypt';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { TenantMigrationRunner } from '../../infrastructure/persistence/tenants/tenant-migration.runner';
import { AdminCG } from '../../chronogest/entities/admin-cg.entity';

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
  ) {}

  async createTenant(input: CreateTenantInput): Promise<{ id: string; slug: string }> {
    const { slug, nombre, dbName } = input;
    const dbHost = input.dbHost ?? process.env.DB_HOST ?? 'db';
    const dbPort = input.dbPort ?? parseInt(process.env.DB_PORT ?? '5432', 10);

    // Validar slug único
    const existingSlug = await this.masterDataSource.query(
      'SELECT id FROM tenants WHERE slug = $1',
      [slug],
    );
    if (existingSlug?.length > 0) {
      throw new BadRequestException(`La sede '${slug}' ya existe`);
    }

    // Validar dbName único
    const existingDb = await this.masterDataSource.query(
      'SELECT id FROM tenants WHERE db_name = $1',
      [dbName],
    );
    if (existingDb?.length > 0) {
      throw new BadRequestException(`La base de datos '${dbName}' ya está en uso`);
    }

    // Crear base de datos física
    await this.createPhysicalDatabase(dbName);

    // Insertar registro en catálogo maestro
    const tenantRows = await this.masterDataSource.query<{ id: string }[]>(
      `INSERT INTO tenants (slug, nombre, db_name, db_host, db_port, activo)
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
      await this.masterDataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      // Nota: no eliminamos la BD física automáticamente para permitir diagnóstico
      throw error;
    }
  }

  async toggleTenantStatus(slug: string, activo: boolean): Promise<void> {
    const result = await this.masterDataSource.query(
      'UPDATE tenants SET activo = $1 WHERE slug = $2 RETURNING id',
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

    // Verificar duplicados a nivel de plataforma
    const existing = await this.masterDataSource.query(
      'SELECT id FROM cg_usuarios WHERE documento = $1 OR correo = $2 LIMIT 1',
      [adminDocumento, adminCorreo],
    );
    if (existing?.length > 0) {
      throw new BadRequestException('El documento o correo del administrador ya está registrado');
    }

    const hashed = await hash(adminPassword, 10);

    // Crear usuario de identidad en sena_db
    await this.masterDataSource.query(
      `INSERT INTO cg_usuarios (id, correo, documento, password, rol, activo, tenant_slug)
       VALUES (uuid_generate_v4(), $1, $2, $3, 'admin', true, $4)`,
      [adminCorreo, adminDocumento, hashed, slug],
    );

    // Crear perfil de administrador en el tenant nuevo
    const adminRepo = await this.connectionManager.getTenantRepository(slug, AdminCG);
    await adminRepo.save({
      nombre: adminNombre,
      apellido: adminApellido ?? '',
      correo: adminCorreo,
      documento: adminDocumento,
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
