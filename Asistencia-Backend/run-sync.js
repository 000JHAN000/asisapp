const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { TenantConnectionManager } = require('./dist/infrastructure/persistence/tenants/tenant-connection.manager');
const { executionAsyncId } = require('async_hooks');

// Mock tenant context
const tenantContext = require('./dist/infrastructure/config/tenant-context');
tenantContext.getCurrentTenantId = () => 'tenant_palmira';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const manager = app.get(TenantConnectionManager);
  
  console.log('Connecting to tenant_palmira to trigger sync...');
  await manager.getTenantDataSource('tenant_palmira');
  console.log('Sync complete.');
  
  await app.close();
  process.exit(0);
}

bootstrap();
