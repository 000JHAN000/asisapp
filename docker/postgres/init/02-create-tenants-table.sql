-- ============================================================
--  ChronoGest — Catálogo maestro de tenants/sedes
--  Se ejecuta dentro de la BD maestra (sena_db).
-- ============================================================

CREATE TABLE IF NOT EXISTS tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(64)  NOT NULL UNIQUE,
  nombre        VARCHAR(255) NOT NULL,
  db_name       VARCHAR(128) NOT NULL,
  db_host       VARCHAR(128) NOT NULL,
  db_port       INTEGER      NOT NULL DEFAULT 5432,
  activo        BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
