import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAsistenciaFacialSchema1782247366571 implements MigrationInterface {
    name = 'AddAsistenciaFacialSchema1782247366571'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."asistencia_orm_entity_estado_enum" AS ENUM('asistio', 'falla', 'tarde', 'excusa')`);
        await queryRunner.query(`CREATE TYPE "public"."formacion_asistencia_orm_entity_estado_enum" AS ENUM('abierta', 'cerrada')`);
        await queryRunner.query(`CREATE TYPE "public"."asistencia_registros_estado_enum" AS ENUM('presente', 'falla_justificada')`);
        await queryRunner.query(`CREATE TYPE "public"."asistencia_sesiones_estado_enum" AS ENUM('activa', 'cerrada', 'cancelada')`);

        await queryRunner.query(`CREATE TABLE "formacion_asistencia_orm_entity" ("id_formacion" uuid NOT NULL DEFAULT uuid_generate_v4(), "fecha" date NOT NULL, "hora_inicio" TIME NOT NULL, "hora_fin" TIME NOT NULL, "horario_fk" uuid, "configuracion_fk" uuid, "cgHorarioId" character varying(36), "estado" "public"."formacion_asistencia_orm_entity_estado_enum" NOT NULL DEFAULT 'abierta', CONSTRAINT "PK_formacion_asistencia" PRIMARY KEY ("id_formacion"))`);

        await queryRunner.query(`CREATE TABLE "asistencia_orm_entity" ("id_asistencia" uuid NOT NULL DEFAULT uuid_generate_v4(), "estado" "public"."asistencia_orm_entity_estado_enum" NOT NULL, "hora" TIME NOT NULL, "observaciones" character varying(260), "formacion_fk" uuid NOT NULL, "archivo_soporte" character varying(500), "aprendizId" character varying(36), CONSTRAINT "PK_asistencia" PRIMARY KEY ("id_asistencia"))`);

        await queryRunner.query(`CREATE TABLE "asistencia_sesiones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "horarioId" character varying(36) NOT NULL, "fecha" date NOT NULL, "horaInicio" TIME NOT NULL, "horaFin" TIME NOT NULL, "estado" "public"."asistencia_sesiones_estado_enum" NOT NULL DEFAULT 'activa', "instructorId" character varying(36) NOT NULL, "formacionAsistenciaId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_asistencia_sesiones" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "asistencia_registros" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sesionId" uuid, "aprendizId" character varying(36) NOT NULL, "estado" "public"."asistencia_registros_estado_enum" NOT NULL DEFAULT 'presente', "horaRegistro" TIMESTAMP NOT NULL DEFAULT now(), "firmaImagen" text, "facePhotoPath" character varying(500), "ipAddress" character varying(45), "latitud" numeric(10,8), "longitud" numeric(11,8), "nota" text, "soporteUrl" character varying(500), "asistenciaId" uuid, CONSTRAINT "PK_asistencia_registros" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "asistencia_registros"`);
        await queryRunner.query(`DROP TABLE "asistencia_sesiones"`);
        await queryRunner.query(`DROP TABLE "asistencia_orm_entity"`);
        await queryRunner.query(`DROP TABLE "formacion_asistencia_orm_entity"`);
        await queryRunner.query(`DROP TYPE "public"."asistencia_registros_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."asistencia_sesiones_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."asistencia_orm_entity_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."formacion_asistencia_orm_entity_estado_enum"`);
    }

}
