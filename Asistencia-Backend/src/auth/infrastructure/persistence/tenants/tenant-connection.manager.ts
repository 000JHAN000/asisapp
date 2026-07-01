import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';

import { AccesoOrmEntity } from '../../../../acceso/infrastructure/entities/acceso.orm-entity';
import { AmbienteOrmEntity } from '../../../../ambiente/infrastructure/entities/ambiente.orm-entity';
import { AplicativoOrmEntity } from '../../../../aplicativo/infrastructure/entities/aplicativo.orm-entity';
import { ConfiguracionAppOrmEntity } from '../../../../aplicativo/infrastructure/entities/configuracion-app.orm-entity';
import { EventoOrmEntity } from '../../../../aplicativo/infrastructure/entities/evento.orm-entity';
import { NotificacionOrmEntity } from '../../../../aplicativo/infrastructure/entities/notificacion.orm-entity';
import { SolicitudCambioOrmEntity } from '../../../../aplicativo/infrastructure/entities/solicitud-cambio.orm-entity';
import { AreaOrmEntity } from '../../../../area/infrastructure/entities/area.orm-entity';
import { AsistenciaRegistroOrmEntity } from '../../../../asistencia/infrastructure/entities/asistencia-registro.orm-entity';
import { AsistenciaSesionOrmEntity } from '../../../../asistencia/infrastructure/entities/asistencia-sesion.orm-entity';
import { AsistenciaOrmEntity } from '../../../../asistencia/infrastructure/entities/asistencia.orm-entity';
import { ConfiguracionAsistenciaOrmEntity } from '../../../../asistencia/infrastructure/entities/configuracion-asistencia.orm-entity';
import { FormacionAsistenciaOrmEntity } from '../../../../asistencia/infrastructure/entities/formacion-asistencia.orm-entity';
import { AsistenciaRegistroTenantEntity } from '../../../../asistencia/infrastructure/entities/tenant/asistencia-registro.tenant-entity';
import { AsistenciaSesionTenantEntity } from '../../../../asistencia/infrastructure/entities/tenant/asistencia-sesion.tenant-entity';
import { AsistenciaTenantEntity } from '../../../../asistencia/infrastructure/entities/tenant/asistencia.tenant-entity';
import { FormacionAsistenciaTenantEntity } from '../../../../asistencia/infrastructure/entities/tenant/formacion-asistencia.tenant-entity';
import { CentroFormacionOrmEntity } from '../../../../centro-formacion/infrastructure/entities/centro-formacion.orm-entity';
import { CredencialOrmEntity } from '../../../../credencial/infrastructure/entities/credencial.orm-entity';
import { CursoOrmEntity } from '../../../../curso/infrastructure/entities/curso.orm-entity';

import { DepartamentoOrmEntity } from '../../../../departamento/infrastructure/entities/departamento.orm-entity';
import { HorarioOrmEntity } from '../../../../horario/infrastructure/entities/horario.orm-entity';
import { MatriculaOrmEntity } from '../../../../matricula/infrastructure/entities/matricula.orm-entity';
import { CompetenciaOrmEntity } from '../../../../modulo/infrastructure/entities/competencia.orm-entity';
import { ModuloOrmEntity } from '../../../../modulo/infrastructure/entities/modulo.orm-entity';
import { MunicipioOrmEntity } from '../../../../municipio/infrastructure/entities/municipio.orm-entity';
import { PermisoOrmEntity } from '../../../../permiso/infrastructure/entities/permiso.orm-entity';
import { InstructorOrmEntity } from '../../../../persona/infrastructure/entities/instructor.orm-entity';
import { PersonaOrmEntity } from '../../../../persona/infrastructure/entities/persona.orm-entity';
import { AdministradorOrmEntity } from '../../../../persona/infrastructure/entities/administrador.orm-entity';
import { ProgramaOrmEntity } from '../../../../programa/infrastructure/entities/programa.orm-entity';
import { RolOrmEntity } from '../../../../rol/infrastructure/entities/rol.orm-entity';
import { SedeOrmEntity } from '../../../../sede/infrastructure/entities/sede.orm-entity';
import { UbicacionOrmEntity } from '../../../../sede/infrastructure/entities/ubicacion.orm-entity';
import { ServicioOrmEntity } from '../../../../servicio/infrastructure/entities/servicio.orm-entity';
import { UsuarioOrmEntity } from '../../../../usuario/infrastructure/entities/usuario.orm-entity';

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
  AccesoOrmEntity,
  AmbienteOrmEntity,
  AplicativoOrmEntity,
  ConfiguracionAppOrmEntity,
  EventoOrmEntity,
  NotificacionOrmEntity,
  SolicitudCambioOrmEntity,
  AreaOrmEntity,
  AsistenciaRegistroOrmEntity,
  AsistenciaSesionOrmEntity,
  AsistenciaOrmEntity,
  ConfiguracionAsistenciaOrmEntity,
  FormacionAsistenciaOrmEntity,
  AsistenciaRegistroTenantEntity,
  AsistenciaSesionTenantEntity,
  AsistenciaTenantEntity,
  FormacionAsistenciaTenantEntity,
  CentroFormacionOrmEntity,
  CredencialOrmEntity,
  CursoOrmEntity,
  DepartamentoOrmEntity,
  HorarioOrmEntity,
  MatriculaOrmEntity,
  CompetenciaOrmEntity,
  ModuloOrmEntity,
  MunicipioOrmEntity,
  PermisoOrmEntity,
  InstructorOrmEntity,
  PersonaOrmEntity,
  AdministradorOrmEntity,
  ProgramaOrmEntity,
  RolOrmEntity,
  SedeOrmEntity,
  UbicacionOrmEntity,
  ServicioOrmEntity,
  UsuarioOrmEntity
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
    >('SELECT id, slug, nombre, activo FROM auth.tenants ORDER BY nombre');
  }

  async resolveTenant(tenantId: string): Promise<TenantRecord> {
    const rows = await this.masterDataSource.query<TenantRecord[]>(
      'SELECT id, slug, nombre, db_name, db_host, db_port, activo FROM auth.tenants WHERE slug = $1',
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
      synchronize: true,
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
