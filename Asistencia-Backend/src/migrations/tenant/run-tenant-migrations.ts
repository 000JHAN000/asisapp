import { DataSource } from 'typeorm';
import { TENANT_BUSINESS_ENTITIES } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';

async function run() {
  const tenantSlug = process.argv[2] || 'caldas';
  const database = `tenant_${tenantSlug}`;

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.TENANT_DB_USER,
    password: process.env.TENANT_DB_PASSWORD,
    database,
    entities: TENANT_BUSINESS_ENTITIES,
    migrations: ['src/migrations/tenant/*.ts'],
    migrationsTableName: 'migrations',
    migrationsRun: true,
    synchronize: false,
  } as any);

  await dataSource.initialize();
  console.log(`Migraciones aplicadas en ${database}`);
  await dataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error ejecutando migraciones:', err);
  process.exit(1);
});
