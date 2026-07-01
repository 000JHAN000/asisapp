import { DataSource } from 'typeorm';
import { hash } from 'bcrypt';
import { config } from 'dotenv';

config();

async function bootstrap() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'sena_db',
    entities: ['src/usuario/infrastructure/entities/usuario-maestro.orm-entity.ts'],
    synchronize: false,
  });

  await dataSource.initialize();

  const correo = process.env.SUPER_ADMIN_EMAIL || 'super@chronogest.local';
  const documento = process.env.SUPER_ADMIN_DOCUMENTO || 'SUPER001';
  const passwordPlain = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin1234!';

  const existing = await dataSource.query(
    'SELECT id FROM auth.usuario_maestro WHERE correo = $1 OR documento = $2',
    [correo, documento],
  );

  if (existing?.length > 0) {
    console.log('El super administrador ya existe.');
    await dataSource.destroy();
    return;
  }

  const password = await hash(passwordPlain, 10);

  await dataSource.query(
    `INSERT INTO auth.usuario_maestro (correo, documento, password, rol, activo, tenant_slug)
     VALUES ($1, $2, $3, 'super_admin', true, null)`,
    [correo, documento, password],
  );

  console.log(`Super administrador creado: ${correo} / ${documento}`);
  await dataSource.destroy();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
