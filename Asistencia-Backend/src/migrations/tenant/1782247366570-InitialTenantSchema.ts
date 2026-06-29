import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialTenantSchema1782247366570 implements MigrationInterface {
    name = 'InitialTenantSchema1782247366570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."cg_solicitudes_cambio_tipo_enum" AS ENUM('cambio_horario', 'cambio_ambiente', 'cambio_jornada', 'otro')`);
        await queryRunner.query(`CREATE TYPE "public"."cg_solicitudes_cambio_estado_enum" AS ENUM('pendiente', 'aprobada', 'rechazada', 'cancelada')`);
        await queryRunner.query(`CREATE TABLE "cg_solicitudes_cambio" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "instructorId" character varying(36) NOT NULL, "horarioId" character varying(36), "tipo" "public"."cg_solicitudes_cambio_tipo_enum" NOT NULL, "estado" "public"."cg_solicitudes_cambio_estado_enum" NOT NULL DEFAULT 'pendiente', "motivo" text NOT NULL, "respuestaAdmin" text, "fechaSolicitud" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_10311ee09c8f8753ab4197d5919" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cg_instructores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(50) NOT NULL, "apellido" character varying(50), "correo" character varying(100) NOT NULL, "documento" character varying(20) NOT NULL, "esLider" boolean NOT NULL DEFAULT false, "areaLiderada" character varying(100), "esTransversal" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_a29838d85437c5f171134fb5ad5" UNIQUE ("correo"), CONSTRAINT "UQ_9232f04998420ba25462cfc53ee" UNIQUE ("documento"), CONSTRAINT "PK_fedae827c42c5ae6595aa6b0bdf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."cg_eventos_tipo_enum" AS ENUM('festivo', 'evaluacion', 'actividad', 'otro')`);
        await queryRunner.query(`CREATE TABLE "cg_eventos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(200) NOT NULL, "tipo" "public"."cg_eventos_tipo_enum" NOT NULL, "fechaInicio" date NOT NULL, "fechaFin" date, "horaInicio" TIME, "horaFin" TIME, "lugar" character varying(200), "descripcion" text, "fichas" json, CONSTRAINT "PK_1755ced1850bbfffe07e028cb3e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cg_aprendices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(50) NOT NULL, "apellido" character varying(50), "correo" character varying(100) NOT NULL, "documento" character varying(20) NOT NULL, "fichaId" character varying(36), "facePhotoPath" character varying(500), "faceEmbedding" text, "lastAttendancePhotoPath" character varying(500), CONSTRAINT "UQ_3f9813d718edb974f4701abd203" UNIQUE ("correo"), CONSTRAINT "UQ_3b07cffad3866e6911ae0e43e32" UNIQUE ("documento"), CONSTRAINT "PK_61cd1a5b7585144acb3a38a4037" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cg_configuracion" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pinRegistro" character varying(10) NOT NULL DEFAULT '1234', CONSTRAINT "PK_964f8b7a50d4a1347b4c4c05202" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cg_ubicaciones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "tipo" character varying(50) NOT NULL, CONSTRAINT "PK_391973e27a56c5a420c9705559c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cg_notificaciones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "titulo" character varying(200) NOT NULL, "mensaje" text NOT NULL, "destinatarioId" character varying(36), "destinatarioRol" character varying(20), "leida" boolean NOT NULL DEFAULT false, "fecha" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d2c27876faabffa6359568e057" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cg_competencias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(200) NOT NULL, "resultado" text, "horasRequeridas" integer, "horarioId" character varying(36) NOT NULL, "fechaInicio" date, "fechaFin" date, "diasClase" json, CONSTRAINT "PK_0fa1cb19914957559ed46317235" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cg_fichas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codigo" character varying(20) NOT NULL, "programa" character varying(100) NOT NULL, "area" character varying(100) NOT NULL, "fechaInicio" date, "fechaFin" date, "intensidadHoraria" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_31aa9ba707064741eb4a7b5d6b8" UNIQUE ("codigo"), CONSTRAINT "PK_1eb399a59ea9a29f8fb94e817bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cg_ambientes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "capacidad" integer, "tipo" character varying(50), "area" character varying(100), CONSTRAINT "PK_0cd135ab0c6094430535eee8400" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cg_administradores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(50) NOT NULL, "apellido" character varying(50), "correo" character varying(100) NOT NULL, "documento" character varying(20) NOT NULL, CONSTRAINT "UQ_50de951479fee00e060f84bf62a" UNIQUE ("correo"), CONSTRAINT "UQ_879255f157c43b75510592b3985" UNIQUE ("documento"), CONSTRAINT "PK_884c41112add399a64db89332ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."cg_horarios_diasemana_enum" AS ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')`);
        await queryRunner.query(`CREATE TYPE "public"."cg_horarios_jornada_enum" AS ENUM('manana', 'tarde', 'noche')`);
        await queryRunner.query(`CREATE TYPE "public"."cg_horarios_estado_enum" AS ENUM('programado', 'activo', 'finalizado', 'cancelado')`);
        await queryRunner.query(`CREATE TABLE "cg_horarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "diaSemana" "public"."cg_horarios_diasemana_enum" NOT NULL, "jornada" "public"."cg_horarios_jornada_enum", "horaInicio" TIME NOT NULL, "horaFin" TIME NOT NULL, "fichaId" character varying(36) NOT NULL, "instructorId" character varying(36) NOT NULL, "ambienteId" character varying(36) NOT NULL, "activo" boolean NOT NULL DEFAULT false, "estado" "public"."cg_horarios_estado_enum" NOT NULL DEFAULT 'programado', "minutosRetraso" integer NOT NULL DEFAULT '0', "ubicacionTransversalNombre" character varying(100), CONSTRAINT "PK_1de010504e1b6dfdba237a5d510" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "cg_horarios"`);
        await queryRunner.query(`DROP TYPE "public"."cg_horarios_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cg_horarios_jornada_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cg_horarios_diasemana_enum"`);
        await queryRunner.query(`DROP TABLE "cg_administradores"`);
        await queryRunner.query(`DROP TABLE "cg_ambientes"`);
        await queryRunner.query(`DROP TABLE "cg_fichas"`);
        await queryRunner.query(`DROP TABLE "cg_competencias"`);
        await queryRunner.query(`DROP TABLE "cg_notificaciones"`);
        await queryRunner.query(`DROP TABLE "cg_ubicaciones"`);
        await queryRunner.query(`DROP TABLE "cg_configuracion"`);
        await queryRunner.query(`DROP TABLE "cg_aprendices"`);
        await queryRunner.query(`DROP TABLE "cg_eventos"`);
        await queryRunner.query(`DROP TYPE "public"."cg_eventos_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "cg_instructores"`);
        await queryRunner.query(`DROP TABLE "cg_solicitudes_cambio"`);
        await queryRunner.query(`DROP TYPE "public"."cg_solicitudes_cambio_tipo_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cg_solicitudes_cambio_estado_enum"`);
    }

}
