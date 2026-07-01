import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTenantsTable1710000000001 implements MigrationInterface {
  name = 'UpdateTenantsTable1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna para activar/suspender sedes
    await queryRunner.query(`
      ALTER TABLE auth.tenants
      ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true
    `);

    // Eliminar columnas de credenciales (ahora vienen de variables de entorno)
    await queryRunner.query(`
      ALTER TABLE auth.tenants
      DROP COLUMN IF EXISTS db_user
    `);

    await queryRunner.query(`
      ALTER TABLE auth.tenants
      DROP COLUMN IF EXISTS db_password
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE auth.tenants
      ADD COLUMN IF NOT EXISTS db_user VARCHAR(128) NOT NULL DEFAULT 'postgres'
    `);

    await queryRunner.query(`
      ALTER TABLE auth.tenants
      ADD COLUMN IF NOT EXISTS db_password VARCHAR(255) NOT NULL DEFAULT ''
    `);

    await queryRunner.query(`
      ALTER TABLE auth.tenants
      DROP COLUMN IF EXISTS activo
    `);
  }
}
