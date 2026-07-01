const { Pool } = require('pg');

async function migrateData(tenantDbName) {
  const pool = new Pool({
    host: 'localhost',
    port: 5440,
    user: 'postgres',
    password: 'alejo.v02',
    database: tenantDbName,
  });

  try {
    console.log(`Starting migration for ${tenantDbName}...`);

    // 1. Rename tables that just need renaming
    const renames = {
      'cg_eventos': 'evento_orm_entity',
      'cg_competencias': 'competencia_orm_entity',
      'cg_notificaciones': 'notificacion_orm_entity',
      'cg_solicitudes_cambio': 'solicitud_cambio_orm_entity',
      'cg_ubicaciones': 'ubicacion_orm_entity',
      'cg_configuracion': 'configuracion_app_orm_entity'
    };

    for (const [oldName, newName] of Object.entries(renames)) {
      try {
        await pool.query(`ALTER TABLE ${oldName} RENAME TO ${newName}`);
        console.log(`Renamed ${oldName} to ${newName}`);
        // Rename id columns
        let idCol = 'id';
        if (newName === 'evento_orm_entity') idCol = 'id_evento';
        if (newName === 'competencia_orm_entity') idCol = 'id_competencia';
        if (newName === 'notificacion_orm_entity') idCol = 'id_notificacion';
        if (newName === 'solicitud_cambio_orm_entity') idCol = 'id_solicitud';
        if (newName === 'ubicacion_orm_entity') idCol = 'id_ubicacion';
        if (newName === 'configuracion_app_orm_entity') idCol = 'id_configuracion_app';

        await pool.query(`ALTER TABLE ${newName} RENAME COLUMN id TO ${idCol}`);
      } catch (err) {
        console.log(`Table ${oldName} already renamed or not found: ${err.message}`);
      }
    }

    // Fix camelCase columns to snake_case in renamed tables
    try { await pool.query(`ALTER TABLE evento_orm_entity RENAME COLUMN "fechaInicio" TO fecha_inicio`); } catch(e){}
    try { await pool.query(`ALTER TABLE evento_orm_entity RENAME COLUMN "fechaFin" TO fecha_fin`); } catch(e){}
    try { await pool.query(`ALTER TABLE evento_orm_entity RENAME COLUMN "horaInicio" TO hora_inicio`); } catch(e){}
    try { await pool.query(`ALTER TABLE evento_orm_entity RENAME COLUMN "horaFin" TO hora_fin`); } catch(e){}
    
    try { await pool.query(`ALTER TABLE competencia_orm_entity RENAME COLUMN "horasRequeridas" TO horas_requeridas`); } catch(e){}
    try { await pool.query(`ALTER TABLE competencia_orm_entity RENAME COLUMN "horarioId" TO horario_fk`); } catch(e){}
    try { await pool.query(`ALTER TABLE competencia_orm_entity RENAME COLUMN "fechaInicio" TO fecha_inicio`); } catch(e){}
    try { await pool.query(`ALTER TABLE competencia_orm_entity RENAME COLUMN "fechaFin" TO fecha_fin`); } catch(e){}
    try { await pool.query(`ALTER TABLE competencia_orm_entity RENAME COLUMN "diasClase" TO dias_clase`); } catch(e){}

    try { await pool.query(`ALTER TABLE notificacion_orm_entity RENAME COLUMN "destinatarioId" TO destinatario_fk`); } catch(e){}
    try { await pool.query(`ALTER TABLE notificacion_orm_entity RENAME COLUMN "destinatarioRol" TO destinatario_rol`); } catch(e){}

    try { await pool.query(`ALTER TABLE solicitud_cambio_orm_entity RENAME COLUMN "instructorId" TO instructor_fk`); } catch(e){}
    try { await pool.query(`ALTER TABLE solicitud_cambio_orm_entity RENAME COLUMN "horarioId" TO horario_fk`); } catch(e){}
    try { await pool.query(`ALTER TABLE solicitud_cambio_orm_entity RENAME COLUMN "respuestaAdmin" TO respuesta_admin`); } catch(e){}
    try { await pool.query(`ALTER TABLE solicitud_cambio_orm_entity RENAME COLUMN "fechaSolicitud" TO fecha_solicitud`); } catch(e){}

    try { await pool.query(`ALTER TABLE configuracion_app_orm_entity RENAME COLUMN "pinRegistro" TO pin_registro`); } catch(e){}

    // 2. Migrate Fichas -> curso_orm_entity, programa_orm_entity, area_orm_entity
    let defaultDeptoId = (await pool.query(`SELECT id_departamento FROM departamento_orm_entity LIMIT 1`)).rows[0]?.id_departamento;
    if (!defaultDeptoId) {
      defaultDeptoId = (await pool.query(`INSERT INTO departamento_orm_entity (nombre) VALUES ('Valle del Cauca') RETURNING id_departamento`)).rows[0].id_departamento;
    }
    let defaultMuniId = (await pool.query(`SELECT id_municipio FROM municipio_orm_entity LIMIT 1`)).rows[0]?.id_municipio;
    if (!defaultMuniId) {
      defaultMuniId = (await pool.query(`INSERT INTO municipio_orm_entity (nombre, departamento_fk) VALUES ('Palmira', $1) RETURNING id_municipio`, [defaultDeptoId])).rows[0].id_municipio;
    }
    let defaultCentroId = (await pool.query(`SELECT id_centro FROM centro_formacion_orm_entity LIMIT 1`)).rows[0]?.id_centro;
    if (!defaultCentroId) {
      defaultCentroId = (await pool.query(`INSERT INTO centro_formacion_orm_entity (nombre, municipio_fk) VALUES ('Centro Default', $1) RETURNING id_centro`, [defaultMuniId])).rows[0].id_centro;
    }
    let defaultSedeId = (await pool.query(`SELECT id_sede FROM sede_orm_entity LIMIT 1`)).rows[0]?.id_sede;
    if (!defaultSedeId) {
      defaultSedeId = (await pool.query(`INSERT INTO sede_orm_entity (nombre, centro_formacion_fk) VALUES ('Sede Default', $1) RETURNING id_sede`, [defaultCentroId])).rows[0].id_sede;
    }
    const fichas = await pool.query(`SELECT * FROM cg_fichas`);
    for (const row of fichas.rows) {
      let areaRes = await pool.query(`SELECT id_area FROM area_orm_entity WHERE nombre = $1`, [row.area]);
      let areaId = areaRes.rows.length ? areaRes.rows[0].id_area : null;
      if (!areaId) {
        areaId = (await pool.query(`INSERT INTO area_orm_entity (nombre, sede_fk) VALUES ($1, $2) RETURNING id_area`, [row.area, defaultSedeId])).rows[0].id_area;
      }

      let progRes = await pool.query(`SELECT id_programa FROM programa_orm_entity WHERE nombre = $1`, [row.programa]);
      let progId = progRes.rows.length ? progRes.rows[0].id_programa : null;
      if (!progId) {
        progId = (await pool.query(`INSERT INTO programa_orm_entity (nombre, tipo_programa) VALUES ($1, 'TECNOLOGO') RETURNING id_programa`, [row.programa])).rows[0].id_programa;
      }

      await pool.query(
        `INSERT INTO curso_orm_entity (id_curso, codigo, fecha_inicio, fecha_fin, fin_lectiva, area_fk, programa_fk, lider, intensidad_horaria)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id_curso) DO NOTHING`,
        [row.id, row.codigo, row.fechaInicio || new Date(), row.fechaFin || new Date(), row.fechaFin || new Date(), areaId, progId, 'admin', row.intensidadHoraria]
      );
    }
    console.log(`✅ Migrated ${fichas.rows.length} Fichas to curso_orm_entity`);

    // 3. Migrate Ambientes -> ambiente_orm_entity
    const ambientes = await pool.query(`SELECT * FROM cg_ambientes`);
    for (const row of ambientes.rows) {
      let areaId = (await pool.query(`SELECT id_area FROM area_orm_entity LIMIT 1`)).rows[0]?.id_area;
      if (!areaId) {
        areaId = (await pool.query(`INSERT INTO area_orm_entity (nombre, sede_fk) VALUES ('Default Area', $1) RETURNING id_area`, [defaultSedeId])).rows[0].id_area;
      }
      
      await pool.query(
        `INSERT INTO ambiente_orm_entity (id_ambiente, nombre, capacidad, tipo, area_fk)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id_ambiente) DO NOTHING`,
        [row.id, row.nombre, row.capacidad, row.tipo, areaId]
      );
    }
    console.log(`Migrated ${ambientes.rows.length} ambientes to ambiente_orm_entity`);

    // 4. Migrate Instructores -> instructor_orm_entity
    const instructores = await pool.query(`SELECT * FROM cg_instructores`);
    for (const row of instructores.rows) {
      // Find persona by documento or insert it
      let persona = await pool.query(`SELECT id_persona FROM persona_orm_entity WHERE documento = $1`, [row.documento]);
      if (persona.rows.length === 0) {
        persona = await pool.query(
          `INSERT INTO persona_orm_entity (documento, tipo_doc, nombres, apellidos, correo, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_persona`,
          [row.documento, 'CC', row.nombre, row.apellido, row.correo, 'activo']
        );
      }
      if (persona.rows.length > 0) {
        await pool.query(
          `INSERT INTO instructor_orm_entity (id_instructor, persona_fk, es_lider, area_liderada, es_transversal)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id_instructor) DO NOTHING`,
          [row.id, persona.rows[0].id_persona, row.esLider, row.areaLiderada, row.esTransversal]
        );
      }
    }
    console.log(`✅ Migrated ${instructores.rows.length} instructores to instructor_orm_entity`);

    // 5. Migrate Horarios -> horario_orm_entity
    const horarios = await pool.query(`SELECT * FROM cg_horarios`);
    for (const row of horarios.rows) {
      await pool.query(
        `INSERT INTO horario_orm_entity (id_horario, curso_fk, ambiente_fk, instructor_fk, "diaSemana", jornada, hora_inicio, hora_fin, activo, estado, minutos_retraso, ubicacion_transversal_nombre)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id_horario) DO NOTHING`,
        [row.id, row.fichaId, row.ambienteId, row.instructorId, row.diaSemana, row.jornada, row.horaInicio, row.horaFin, row.activo, row.estado, row.minutosRetraso, row.ubicacionTransversalNombre]
      );
    }
    console.log(`✅ Migrated ${horarios.rows.length} horarios to horario_orm_entity`);

    const aprendices = await pool.query(`SELECT * FROM cg_aprendices`);
    for (const row of aprendices.rows) {
      let persona = await pool.query(`SELECT id_persona FROM persona_orm_entity WHERE documento = $1`, [row.documento]);
      if (persona.rows.length === 0) {
        persona = await pool.query(
          `INSERT INTO persona_orm_entity (documento, tipo_doc, nombres, apellidos, correo, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_persona`,
          [row.documento, 'CC', row.nombre, row.apellido, row.correo, 'activo']
        );
      }
      if (persona.rows.length > 0) {
        if (row.facePhotoPath) {
          await pool.query(`UPDATE persona_orm_entity SET face_photo_path = $1, face_embedding = $2 WHERE id_persona = $3`, [row.facePhotoPath, row.faceEmbedding, persona.rows[0].id_persona]);
        }
        if (row.fichaId) {
          await pool.query(
            `INSERT INTO matricula_orm_entity (persona_fk, curso_fk) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [persona.rows[0].id_persona, row.fichaId]
          );
        }
      }
    }
    console.log(`Migrated ${aprendices.rows.length} aprendices to matricula_orm_entity`);

    console.log(`Migration for ${tenantDbName} finished successfully.`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrateData('tenant_palmira');
