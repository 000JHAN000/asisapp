import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUsuarioRol1710000000000 implements MigrationInterface {
  name = 'UpdateUsuarioRol1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Convertir la columna rol de enum a varchar para soportar nuevos roles dinámicamente
    await queryRunner.query(`
      ALTER TABLE cg_usuarios
      ALTER COLUMN rol TYPE VARCHAR(20)
      USING rol::VARCHAR(20)
    `);

    // Eliminar el tipo enum si existe
    await queryRunner.query(`
      DROP TYPE IF EXISTS cg_usuarios_rol_enum
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recrear el enum original
    await queryRunner.query(`
      CREATE TYPE cg_usuarios_rol_enum AS ENUM ('admin', 'instructor', 'aprendiz')
    `);

    // Convertir de vuelta (fallará si hay super_admin, lo cual es esperado)
    await queryRunner.query(`
      ALTER TABLE cg_usuarios
      ALTER COLUMN rol TYPE cg_usuarios_rol_enum
      USING rol::cg_usuarios_rol_enum
    `);
  }
}
