const { DataSource } = require('typeorm');
const path = require('path');
const fs = require('fs');

async function run() {
  const connectionManagerFile = fs.readFileSync(path.join(__dirname, 'src/infrastructure/persistence/tenants/tenant-connection.manager.ts'), 'utf8');
  
  // We'll just load the entities using ts-node and the actual exported array
  require('ts-node').register({ transpileOnly: true });
  
  const { TENANT_BUSINESS_ENTITIES } = require('./src/infrastructure/persistence/tenants/tenant-connection.manager.ts');

  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5440,
    username: 'postgres',
    password: 'alejo.v02',
    database: 'tenant_palmira',
    entities: TENANT_BUSINESS_ENTITIES,
    synchronize: true, // Trigger sync
  });

  try {
    console.log('Connecting and syncing...');
    await dataSource.initialize();
    console.log('Sync successful.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

run();
