-- ============================================================
--  ChronoGest — Creación de bases de datos por sede (tenant)
--  Patrón: Database-per-Tenant
-- ============================================================

-- PostgreSQL no soporta IF NOT EXISTS en CREATE DATABASE.
-- Usamos una función PL/pgSQL para evitar errores si ya existen.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'sena_db_yamborot') THEN
    CREATE DATABASE sena_db_yamborot;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'sena_db_centro_comercio') THEN
    CREATE DATABASE sena_db_centro_comercio;
  END IF;
END
$$;
