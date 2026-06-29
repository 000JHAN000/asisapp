import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';

import { Ficha } from '../../../chronogest/entities/ficha.entity';
import { AmbienteCG } from '../../../chronogest/entities/ambiente-cg.entity';
import { InstructorCG } from '../../../chronogest/entities/instructor-cg.entity';
import { AprendizCG } from '../../../chronogest/entities/aprendiz-cg.entity';
import { AdminCG } from '../../../chronogest/entities/admin-cg.entity';
import { HorarioCG } from '../../../chronogest/entities/horario-cg.entity';
import { Competencia } from '../../../chronogest/entities/competencia.entity';
import { Evento } from '../../../chronogest/entities/evento.entity';
import { SolicitudCambio } from '../../../chronogest/entities/solicitud-cambio.entity';
import { Notificacion } from '../../../chronogest/entities/notificacion.entity';
import { ConfiguracionApp } from '../../../chronogest/entities/configuracion-app.entity';
import { Ubicacion } from '../../../chronogest/entities/ubicacion.entity';
import { AsistenciaRegistroTenantEntity } from '../../../asistencia/infrastructure/entities/tenant/asistencia-registro.tenant-entity';
import { AsistenciaSesionTenantEntity } from '../../../asistencia/infrastructure/entities/tenant/asistencia-sesion.tenant-entity';
import { AsistenciaTenantEntity } from '../../../asistencia/infrastructure/entities/tenant/asistencia.tenant-entity';
import { FormacionAsistenciaTenantEntity } from '../../../asistencia/infrastructure/entities/tenant/formacion-asistencia.tenant-entity';


export interface TenantRecord {
  id: string;
  slug: string;
  nombre: string;
  db_name: string;
  db_host: string;
  db_port: number;
  activo: boolean;
}

export const TENANT_BUSINESS_ENTITIES = [
  Ficha,
  AmbienteCG,
  InstructorCG,
  AprendizCG,
  AdminCG,
  HorarioCG,
  Competencia,
  Evento,
  SolicitudCambio,
  Notificacion,
  ConfiguracionApp,
  Ubicacion,
  AsistenciaRegistroTenantEntity,
  AsistenciaSesionTenantEntity,
  AsistenciaTenantEntity,
  FormacionAsistenciaTenantEntity,
];

@Injectable()
export class TenantConnectionManager implements OnApplicationShutdown {
  private readonly logger = new Logger(TenantConnectionManager.name);
  private tenantsDataSources = new Map<string, DataSource>();
  private accessOrder: string[] = [];

  constructor(
    @InjectDataSource()
    private readonly masterDataSource: DataSource,
  ) {}

  private get maxPools(): number {
    return parseInt(process.env.TENANT_MAX_POOLS ?? '20', 10);
  }

  private get dbUser(): string {
    const user = process.env.TENANT_DB_USER;
    if (!user) {
      throw new Error('Variable de entorno TENANT_DB_USER no configurada');
    }
    return user;
  }

  private get dbPassword(): string {
    const pass = process.env.TENANT_DB_PASSWORD;
    if (!pass) {
      throw new Error('Variable de entorno TENANT_DB_PASSWORD no configurada');
    }
    return pass;
  }

  async findAll(): Promise<Pick<TenantRecord, 'id' | 'slug' | 'nombre' | 'activo'>[]> {
    return this.masterDataSource.query<
      Pick<TenantRecord, 'id' | 'slug' | 'nombre' | 'activo'>[]
    >('SELECT id, slug, nombre, activo FROM tenants ORDER BY nombre');
  }

  async resolveTenant(tenantId: string): Promise<TenantRecord> {
    const rows = await this.masterDataSource.query<TenantRecord[]>(
      'SELECT id, slug, nombre, db_name, db_host, db_port, activo FROM tenants WHERE slug = $1',
      [tenantId],
    );

    if (!rows || rows.length === 0) {
      throw new Error(`Tenant '${tenantId}' no encontrado en el catálogo`);
    }

    return rows[0];
  }

  async getTenantDataSource(tenantId: string): Promise<DataSource> {
    const existing = this.tenantsDataSources.get(tenantId);

    if (existing?.isInitialized) {
      this.touchAccess(tenantId);
      return existing;
    }

    if (existing && !existing.isInitialized) {
      await existing.destroy();
      this.tenantsDataSources.delete(tenantId);
      this.removeAccess(tenantId);
    }

    const tenant = await this.resolveTenant(tenantId);

    if (!tenant.activo) {
      throw new Error(`Tenant '${tenantId}' está suspendido`);
    }

    this.logger.log(`Inicializando DataSource para tenant: ${tenant.slug} (${tenant.db_name})`);

    await this.enforceMaxPools();

    const dataSource = new DataSource({
      type: 'postgres',
      host: tenant.db_host,
      port: tenant.db_port,
      username: this.dbUser,
      password: this.dbPassword,
      database: tenant.db_name,
      entities: TENANT_BUSINESS_ENTITIES,
      logging: process.env.NODE_ENV === 'development',
    } as any);

    await dataSource.initialize();
    this.tenantsDataSources.set(tenantId, dataSource);
    this.touchAccess(tenantId);

    return dataSource;
  }

  async getTenantRepository<T extends ObjectLiteral>(tenantId: string, entity: EntityTarget<T>): Promise<Repository<T>> {
    const ds = await this.getTenantDataSource(tenantId);
    return ds.getRepository(entity);
  }

  async closeAll(): Promise<void> {
    for (const [tenantId, dataSource] of this.tenantsDataSources.entries()) {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
      this.tenantsDataSources.delete(tenantId);
    }
    this.accessOrder = [];
  }

  async onApplicationShutdown(): Promise<void> {
    await this.closeAll();
  }

  private touchAccess(tenantId: string): void {
    this.removeAccess(tenantId);
    this.accessOrder.push(tenantId);
  }

  private removeAccess(tenantId: string): void {
    this.accessOrder = this.accessOrder.filter((id) => id !== tenantId);
  }

  private async enforceMaxPools(): Promise<void> {
    while (this.tenantsDataSources.size >= this.maxPools) {
      const lru = this.accessOrder.shift();
      if (!lru) break;

      const ds = this.tenantsDataSources.get(lru);
      if (ds) {
        this.logger.log(`Cerrando DataSource LRU: ${lru}`);
        if (ds.isInitialized) {
          await ds.destroy();
        }
        this.tenantsDataSources.delete(lru);
      }
    }
  }
}
