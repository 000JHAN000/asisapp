-- Migrar competencias, eventos, notificaciones, solicitudes, configuración
-- y corregir instructor_fk NULL en horarios legacy conectados.
-- Idempotente: solo actualiza horarios con instructor_fk NULL e ignora duplicados.

DO $$
BEGIN
  -- Corrección robusta de instructor_fk (por si el LEFT JOIN original falló)
  UPDATE horario_orm_entity h
  SET instructor_fk = sub.id_instructor
  FROM (
    SELECT DISTINCT ON (h.id_horario) h.id_horario, i.id_instructor
    FROM horario_orm_entity h
    JOIN curso_orm_entity c ON h.curso_fk = c.id_curso
    JOIN cg_fichas cf ON cf.codigo = c.codigo
    JOIN cg_horarios ch ON ch."fichaId" = cf.id::text
    JOIN cg_instructores cg ON cg.id::uuid = ch."instructorId"::uuid
    JOIN persona_orm_entity p ON p.documento = cg.documento
    JOIN instructor_orm_entity i ON i.persona_fk = p.id_persona
    WHERE h.instructor_fk IS NULL
    ORDER BY h.id_horario, i.id_instructor
  ) sub
  WHERE h.id_horario = sub.id_horario;

  -- Competencias
  INSERT INTO competencia_orm_entity (id_competencia, nombre, resultado, horas_requeridas, horario_fk, fecha_inicio, fecha_fin, dias_clase)
  SELECT id, nombre, resultado, "horasRequeridas", "horarioId"::uuid, "fechaInicio", "fechaFin", "diasClase"
  FROM cg_competencias
  ON CONFLICT DO NOTHING;

  -- Eventos
  INSERT INTO evento_orm_entity (id_evento, nombre, tipo, fecha_inicio, fecha_fin, hora_inicio, hora_fin, lugar, descripcion, fichas)
  SELECT id, nombre, tipo::text::evento_orm_entity_tipo_enum, "fechaInicio", "fechaFin", "horaInicio", "horaFin", lugar, descripcion, fichas
  FROM cg_eventos
  ON CONFLICT DO NOTHING;

  -- Notificaciones (destinatario_fk se intenta castear a uuid; si no aplica queda NULL)
  INSERT INTO notificacion_orm_entity (id_notificacion, titulo, mensaje, destinatario_fk, destinatario_rol, leida, fecha)
  SELECT n.id, n.titulo, n.mensaje, NULLIF(trim(n."destinatarioId"), '')::uuid, n."destinatarioRol", n.leida, n.fecha
  FROM cg_notificaciones n
  ON CONFLICT DO NOTHING;

  -- Solicitudes de cambio
  INSERT INTO solicitud_cambio_orm_entity (id_solicitud, instructor_fk, horario_fk, tipo, estado, motivo, respuesta_admin, fecha_solicitud)
  SELECT s.id, map_i.id_instructor, h.id_horario, s.tipo::text::solicitud_cambio_orm_entity_tipo_enum, s.estado::text::solicitud_cambio_orm_entity_estado_enum, s.motivo, s."respuestaAdmin", s."fechaSolicitud"
  FROM cg_solicitudes_cambio s
  LEFT JOIN instructor_orm_entity map_i ON map_i.id_instructor = s."instructorId"::uuid
  LEFT JOIN horario_orm_entity h ON h.id_horario = s."horarioId"::uuid
  ON CONFLICT DO NOTHING;

  -- Configuración de la app
  INSERT INTO configuracion_app_orm_entity (id_configuracion_app, pin_registro)
  SELECT id, "pinRegistro"
  FROM cg_configuracion
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Extras migrados y horarios corregidos para el tenant';
END $$;
