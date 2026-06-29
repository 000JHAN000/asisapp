import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantRecord, TENANT_BUSINESS_ENTITIES } from './tenant-connection.manager';
import { InitialTenantSchema1782247366570 } from '../../../migrations/tenant/1782247366570-InitialTenantSchema';
import { AddAsistenciaFacialSchema1782247366571 } from '../../../migrations/tenant/1782247366571-AddAsistenciaFacialSchema';

@Injectable()
export class TenantMigrationRunner {
  private readonly logger = new Logger(TenantMigrationRunner.name);

  private get dbUser(): string {
    const user = process.env.TENANT_DB_USER;
    if (!user) throw new Error('Variable de entorno TENANT_DB_USER no configurada');
    return user;
  }

  private get dbPassword(): string {
    const pass = process.env.TENANT_DB_PASSWORD;
    if (!pass) throw new Error('Variable de entorno TENANT_DB_PASSWORD no configurada');
    return pass;
  }

  async runMigrations(tenant: TenantRecord): Promise<void> {
    this.logger.log(`Ejecutando migraciones para tenant: ${tenant.slug} (${tenant.db_name})`);

    const dataSource = new DataSource({
      type: 'postgres',
      host: tenant.db_host,
      port: tenant.db_port,
      username: this.dbUser,
      password: this.dbPassword,
      database: tenant.db_name,
      entities: TENANT_BUSINESS_ENTITIES,
      migrations: [InitialTenantSchema1782247366570, AddAsistenciaFacialSchema1782247366571],
      migrationsTableName: 'migrations',
      migrationsRun: true,
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    } as any);

    try {
      await dataSource.initialize();
      this.logger.log(`Migraciones aplicadas para tenant: ${tenant.slug}`);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }
}
