const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function migrateMasterUsers() {
  const pool = new Pool({
    host: 'localhost',
    port: 5440,
    user: 'postgres',
    password: 'alejo.v02',
    database: 'sena_db',
  });

  try {
    console.log(`Starting migration for master database (sena_db)...`);

    // 1. Get all roles to map them correctly
    const rolesRes = await pool.query('SELECT * FROM rol_orm_entity');
    const rolesMap = {};
    for (const rol of rolesRes.rows) {
      rolesMap[rol.nombre] = rol.id_rol;
    }
    
    // Ensure all 4 basic roles exist
    const basicRoles = ['super_admin', 'admin', 'instructor', 'aprendiz'];
    for (const r of basicRoles) {
      if (!rolesMap[r]) {
        console.log(`Creating missing role: ${r}`);
        const res = await pool.query(`INSERT INTO rol_orm_entity (nombre, descripcion) VALUES ($1, $2) RETURNING id_rol`, [r, r]);
        rolesMap[r] = res.rows[0].id_rol;
      }
    }

    // 2. Fetch all legacy users
    const usuarios = await pool.query(`SELECT * FROM cg_usuarios`);
    console.log(`Found ${usuarios.rows.length} users in cg_usuarios. Migrating...`);

    for (const user of usuarios.rows) {
      // a. Upsert Persona
      let personaId;
      const existingPersona = await pool.query(`SELECT id_persona FROM persona_orm_entity WHERE documento = $1 OR correo = $2 LIMIT 1`, [user.documento, user.correo]);
      
      if (existingPersona.rows.length > 0) {
        personaId = existingPersona.rows[0].id_persona;
      } else {
        const pRes = await pool.query(
          `INSERT INTO persona_orm_entity (documento, tipo_doc, nombres, apellidos, correo, telefono, municipio_fk, estado) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_persona`,
          [user.documento, user.tipo_doc || 'CC', 'Usuario', user.documento, user.correo, null, null, user.activo ? 'activo' : 'inactivo']
        );
        personaId = pRes.rows[0].id_persona;
      }

      // b. Upsert Usuario
      let usuarioId;
      const existingUsuario = await pool.query(`SELECT id_usuario FROM usuario_orm_entity WHERE persona_fk = $1 LIMIT 1`, [personaId]);
      if (existingUsuario.rows.length > 0) {
        usuarioId = existingUsuario.rows[0].id_usuario;
        // Update tenant if changed
        await pool.query(`UPDATE usuario_orm_entity SET tenant_slug = $1 WHERE id_usuario = $2`, [user.tenant_slug, usuarioId]);
      } else {
        // App ID defaults to some UUID, let's just fetch one
        let appId = (await pool.query(`SELECT id_aplicativo FROM aplicativo_orm_entity LIMIT 1`)).rows[0]?.id_aplicativo;
        if (!appId) {
          appId = (await pool.query(`INSERT INTO aplicativo_orm_entity (nombre, url, version) VALUES ('ChronoGest', 'url', '1.0') RETURNING id_aplicativo`)).rows[0].id_aplicativo;
        }

        const uRes = await pool.query(
          `INSERT INTO usuario_orm_entity (persona_fk, aplicativo_fk, tenant_slug, activo) VALUES ($1, $2, $3, $4) RETURNING id_usuario`,
          [personaId, appId, user.tenant_slug, user.activo]
        );
        usuarioId = uRes.rows[0].id_usuario;
      }

      // c. Hash Password (if it's not already a bcrypt hash)
      let finalPassword = user.password;
      if (!finalPassword.startsWith('$2b$')) {
        finalPassword = await bcrypt.hash(finalPassword, 10);
      }

      // d. Upsert Credencial
      const existingCred = await pool.query(`SELECT id_credencial FROM credencial_orm_entity WHERE usuario_fk = $1 LIMIT 1`, [usuarioId]);
      if (existingCred.rows.length > 0) {
        await pool.query(
          `UPDATE credencial_orm_entity SET login = $1, password = $2, rol_fk = $3 WHERE id_credencial = $4`,
          [user.correo, finalPassword, rolesMap[user.rol], existingCred.rows[0].id_credencial]
        );
      } else {
        await pool.query(
          `INSERT INTO credencial_orm_entity (usuario_fk, rol_fk, login, password) VALUES ($1, $2, $3, $4)`,
          [usuarioId, rolesMap[user.rol], user.correo, finalPassword]
        );
      }
    }

    console.log(`Successfully migrated ${usuarios.rows.length} users to persona, usuario, and credencial tables with encrypted passwords!`);

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrateMasterUsers();
