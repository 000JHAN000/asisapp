-- ============================================================
--  ChronoGest — Migración de usuarios existentes a sede por defecto
--  Los usuarios que no tengan sede quedan asignados a Yamborot.
-- ============================================================

UPDATE cg_usuarios
SET tenant_slug = 'yamborot'
WHERE tenant_slug IS NULL OR tenant_slug = '';
