-- Migrar datos CG a tablas legacy conectadas dentro de un tenant
-- Requisitos: tablas legacy ya creadas (vacias)

DO $$
DECLARE
  v_departamento_id uuid := '00000000-0000-0000-0000-000000000001';
  v_municipio_id uuid := '00000000-0000-0000-0000-000000000002';
  v_centro_id uuid := '00000000-0000-0000-0000-000000000003';
  v_sede_id uuid := '00000000-0000-0000-0000-000000000004';
BEGIN
  IF (SELECT count(*) FROM persona_orm_entity) > 0 THEN
    RAISE NOTICE 'persona_orm_entity ya tiene datos, se omite migracion';
    RETURN;
  END IF;

  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  INSERT INTO departamento_orm_entity (id_departamento, nombre) VALUES (v_departamento_id, 'General') ON CONFLICT DO NOTHING;
  INSERT INTO municipio_orm_entity (id_municipio, nombre, departamento_fk) VALUES (v_municipio_id, 'General', v_departamento_id) ON CONFLICT DO NOTHING;
  INSERT INTO centro_formacion_orm_entity (id_centro, nombre, municipio_fk) VALUES (v_centro_id, 'Centro de Formacion', v_municipio_id) ON CONFLICT DO NOTHING;
  INSERT INTO sede_orm_entity (id_sede, nombre, centro_formacion_fk) VALUES (v_sede_id, 'Sede Principal', v_centro_id) ON CONFLICT DO NOTHING;

  -- Areas
  WITH areas AS (
    SELECT DISTINCT trim(area) as nombre FROM cg_fichas WHERE area IS NOT NULL
    UNION
    SELECT DISTINCT trim(area) FROM cg_ambientes WHERE area IS NOT NULL
  )
  INSERT INTO area_orm_entity (id_area, nombre, sede_fk)
  SELECT uuid_generate_v4(), nombre, v_sede_id FROM areas;

  -- Programas
  WITH progs AS (
    SELECT DISTINCT trim(programa) as nombre FROM cg_fichas WHERE programa IS NOT NULL
  )
  INSERT INTO programa_orm_entity (id_programa, nombre, tipo_programa)
  SELECT uuid_generate_v4(), nombre, 'Tecnologo' FROM progs;

  -- Instructores
  CREATE TEMP TABLE tmp_map_instructor (id_instructor uuid, cg_id uuid);
  WITH ins_persona AS (
    INSERT INTO persona_orm_entity (documento, nombres, apellidos, correo, estado)
    SELECT documento, nombre, apellido, correo, 'activo' FROM cg_instructores
    RETURNING id_persona, documento
  ),
  ins_instructor AS (
    INSERT INTO instructor_orm_entity (persona_fk, es_lider, area_liderada, es_transversal)
    SELECT p.id_persona, COALESCE(cg."esLider", false), cg."areaLiderada", COALESCE(cg."esTransversal", false)
    FROM ins_persona p
    JOIN cg_instructores cg ON cg.documento = p.documento
    RETURNING id_instructor, persona_fk
  )
  INSERT INTO tmp_map_instructor (id_instructor, cg_id)
  SELECT ins.id_instructor, cg.id
  FROM ins_instructor ins
  JOIN persona_orm_entity p ON p.id_persona = ins.persona_fk
  JOIN cg_instructores cg ON cg.documento = p.documento;

  -- Aprendices
  CREATE TEMP TABLE tmp_map_aprendiz (id_persona uuid, cg_id uuid);
  WITH ap_persona AS (
    INSERT INTO persona_orm_entity (documento, nombres, apellidos, correo, estado)
    SELECT documento, nombre, apellido, correo, 'activo' FROM cg_aprendices
    RETURNING id_persona, documento
  )
  INSERT INTO tmp_map_aprendiz (id_persona, cg_id)
  SELECT ap.id_persona, cg.id
  FROM ap_persona ap
  JOIN cg_aprendices cg ON cg.documento = ap.documento;

  -- Administradores
  CREATE TEMP TABLE tmp_map_admin (id_administrador uuid, cg_id uuid);
  WITH ad_persona AS (
    INSERT INTO persona_orm_entity (documento, nombres, apellidos, correo, estado)
    SELECT documento, nombre, apellido, correo, 'activo' FROM cg_administradores
    RETURNING id_persona, documento
  ),
  ins_admin AS (
    INSERT INTO administrador_orm_entity (persona_fk)
    SELECT p.id_persona FROM ad_persona p
    RETURNING id_administrador, persona_fk
  )
  INSERT INTO tmp_map_admin (id_administrador, cg_id)
  SELECT ia.id_administrador, cg.id
  FROM ins_admin ia
  JOIN persona_orm_entity p ON p.id_persona = ia.persona_fk
  JOIN cg_administradores cg ON cg.documento = p.documento;

  -- Cursos
  CREATE TEMP TABLE tmp_map_curso (id_curso uuid, codigo varchar(20));
  WITH cursos_insert AS (
    INSERT INTO curso_orm_entity (id_curso, codigo, fecha_inicio, fecha_fin, fin_lectiva, area_fk, programa_fk, lider, intensidad_horaria)
    SELECT f.id, f.codigo, f."fechaInicio", f."fechaFin", f."fechaFin", a.id_area, p.id_programa, '', f."intensidadHoraria"
    FROM cg_fichas f
    JOIN area_orm_entity a ON a.nombre = trim(f.area)
    JOIN programa_orm_entity p ON p.nombre = trim(f.programa)
    RETURNING id_curso, codigo
  )
  INSERT INTO tmp_map_curso (id_curso, codigo)
  SELECT id_curso, codigo FROM cursos_insert;

  -- Matriculas
  INSERT INTO matricula_orm_entity (persona_fk, curso_fk)
  SELECT map_ap.id_persona, map_c.id_curso
  FROM cg_aprendices cg
  JOIN tmp_map_aprendiz map_ap ON map_ap.cg_id = cg.id
  JOIN cg_fichas f ON f.id = cg."fichaId"::uuid
  JOIN tmp_map_curso map_c ON map_c.codigo = f.codigo;

  -- Ambientes
  CREATE TEMP TABLE tmp_map_ambiente (id_ambiente uuid, nombre varchar(100));
  WITH amb_insert AS (
    INSERT INTO ambiente_orm_entity (id_ambiente, nombre, capacidad, tipo, area_fk)
    SELECT cg.id, cg.nombre, cg.capacidad, cg.tipo, a.id_area
    FROM cg_ambientes cg
    JOIN area_orm_entity a ON a.nombre = trim(cg.area)
    RETURNING id_ambiente, nombre
  )
  INSERT INTO tmp_map_ambiente (id_ambiente, nombre)
  SELECT id_ambiente, nombre FROM amb_insert;

  -- Horarios
  INSERT INTO horario_orm_entity (id_horario, "diaSemana", jornada, hora_inicio, hora_fin, curso_fk, instructor_fk, ambiente_fk, activo, estado, minutos_retraso, ubicacion_transversal_nombre)
  SELECT h.id, h."diaSemana"::text::horario_orm_entity_diasemana_enum, h."jornada"::text::horario_orm_entity_jornada_enum, h."horaInicio", h."horaFin",
         map_c.id_curso,
         map_i.id_instructor,
         map_a.id_ambiente,
         h.activo, h.estado::text::horario_orm_entity_estado_enum, h."minutosRetraso", h."ubicacionTransversalNombre"
  FROM cg_horarios h
  LEFT JOIN tmp_map_curso map_c ON map_c.id_curso = h."fichaId"::uuid
  LEFT JOIN tmp_map_instructor map_i ON map_i.cg_id = h."instructorId"::uuid
  LEFT JOIN tmp_map_ambiente map_a ON map_a.id_ambiente = h."ambienteId"::uuid;

  -- Corrección robusta: rellenar instructor_fk que haya quedado NULL usando documento como puente
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

  -- Notificaciones (destinatario se intenta mapear a persona; si no es posible queda NULL)
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

  RAISE NOTICE 'Migracion completada para el tenant';
END $$;
