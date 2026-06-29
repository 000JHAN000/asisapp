const { DataSource } = require('typeorm');
require('dotenv').config();

const isMaster = process.env.TYPEORM_MASTER === 'true';

module.exports = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: isMaster
    ? ['src/chronogest/entities/usuario-cg.entity.ts', 'src/tenants/**/*.entity.ts']
    : ['src/chronogest/entities/**/*.entity.ts', 'src/asistencia/**/*.entity.ts'],
  migrations: isMaster
    ? ['src/migrations/master/*.ts']
    : ['src/migrations/tenant/*.ts'],
  migrationsTableName: isMaster ? 'migrations_master' : 'migrations',
  synchronize: false,
});
