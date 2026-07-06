const axios = require('axios');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001/api';
const MASTER_DB = { host: 'localhost', port: 5440, user: 'postgres', password: 'alejo.v02', database: 'sena_db' };
const TENANT_DB = { host: 'localhost', port: 5440, user: 'postgres', password: 'alejo.v02', database: 'tenant_palmira' };
const TEST_PASSWORD = 'Test1234!';
const ORIGINAL_HASH = '$2b$10$Z2g0HjCUaufCinE8MYcMG.5mcjrSbtFqAFcedX6hZEIGbHrhCjQky';
const TEST_HASH = '$2b$10$HO/0yM54amNXAbEPnOLUG.ZD7T.z2gaFxAKd6O3BYRHzCZjtuzODG';
const APRENDIZ_LOGIN = 'aprendiz@palmira.com';
const INSTRUCTOR_LOGIN = 'instructorpalmira123@test.com';
const TENANT_SLUG = 'palmira';
const HORARIO_ID = 'dc927f99-c6b1-4134-a396-2248bedbd4a1';
const IMAGE_PATH = path.resolve(__dirname, '..', 'backups', 'residuos-2026-07-02', 'python-face-service', 'test_face2.jpg');

const masterPool = new Pool(MASTER_DB);
const tenantPool = new Pool(TENANT_DB);

function getColombiaDateString() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

function imageToBase64(filePath) {
  const buf = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function updatePassword(login, hash) {
  await masterPool.query('UPDATE credencial_orm_entity SET password = $1 WHERE login = $2', [hash, login]);
}

async function loginUser(identifier, password) {
  const res = await axios.post(`${BASE_URL}/auth-cg/login`, { identifier, password }, {
    headers: { 'x-tenant-id': TENANT_SLUG },
  });
  return res.data;
}

async function main() {
  console.log('=== Preparando prueba de flujo de asistencia ===');
  if (!fs.existsSync(IMAGE_PATH)) {
    throw new Error(`Imagen de prueba no encontrada: ${IMAGE_PATH}`);
  }

  console.log('Actualizando passwords temporales...');
  await updatePassword(APRENDIZ_LOGIN, TEST_HASH);
  await updatePassword(INSTRUCTOR_LOGIN, TEST_HASH);

  const fechaHoy = getColombiaDateString();
  console.log(`Fecha Colombia hoy: ${fechaHoy}`);

  // Login instructor
  console.log('Login instructor...');
  const instructor = await loginUser(INSTRUCTOR_LOGIN, TEST_PASSWORD);
  console.log(`Instructor perfilId: ${instructor.user.perfilId}`);

  // Crear sesión
  console.log('Creando sesión de asistencia...');
  const sesionRes = await axios.post(`${BASE_URL}/asistencia/sesiones`, {
    horarioId: HORARIO_ID,
    fecha: fechaHoy,
    horaInicio: '08:00:00',
    horaFin: '10:00:00',
  }, {
    headers: {
      Authorization: `Bearer ${instructor.access_token}`,
      'x-tenant-id': TENANT_SLUG,
    },
  });
  const sesionId = sesionRes.data.id;
  console.log(`Sesión creada: ${sesionId}`);

  // Login aprendiz
  console.log('Login aprendiz...');
  const aprendiz = await loginUser(APRENDIZ_LOGIN, TEST_PASSWORD);
  console.log(`Aprendiz perfilId: ${aprendiz.user.perfilId}`);

  const imageB64 = imageToBase64(IMAGE_PATH);

  // Registrar rostro base
  console.log('Registrando rostro base del aprendiz...');
  const regFace = await axios.post(`${BASE_URL}/aprendices/me/register-face`, { image: imageB64 }, {
    headers: {
      Authorization: `Bearer ${aprendiz.access_token}`,
      'x-tenant-id': TENANT_SLUG,
    },
  });
  console.log('Registro rostro:', regFace.data);
  if (!regFace.data.success) {
    throw new Error('No se pudo registrar el rostro base');
  }

  // Verificar rostro
  console.log('Verificando rostro...');
  const verifyRes = await axios.post(`${BASE_URL}/asistencia/registros/verificar-rostro`, {
    faceVerificationImage: imageB64,
  }, {
    headers: {
      Authorization: `Bearer ${aprendiz.access_token}`,
      'x-tenant-id': TENANT_SLUG,
    },
  });
  console.log('Verificación rostro:', verifyRes.data);

  // Registrar firma / asistencia
  console.log('Registrando firma de asistencia...');
  const firmaRes = await axios.post(`${BASE_URL}/asistencia/registros/firma`, {
    sesionId,
    faceVerificationImage: imageB64,
    firmaImagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  }, {
    headers: {
      Authorization: `Bearer ${aprendiz.access_token}`,
      'x-tenant-id': TENANT_SLUG,
      'x-forwarded-for': '192.168.1.100',
    },
  });
  console.log('Firma registrada:', firmaRes.data);

  // Verificar en BD
  console.log('Verificando registro en base de datos...');
  const registro = await tenantPool.query(
    'SELECT id, "sesionId", "aprendizId", estado, "horaRegistro", "ipAddress", "facePhotoPath" FROM asistencia_registros WHERE "sesionId" = $1 AND "aprendizId" = $2',
    [sesionId, aprendiz.user.perfilId]
  );
  console.log('Registro en BD:', JSON.stringify(registro.rows[0], null, 2));

  const row = registro.rows[0];
  let ok = true;
  if (!row) {
    console.error('❌ No se encontró el registro en BD');
    ok = false;
  } else {
    if (!row.ipAddress || row.ipAddress.startsWith('::') || row.ipAddress === '127.0.0.1') {
      console.error(`❌ IP no normalizada o inesperada: ${row.ipAddress}`);
      ok = false;
    } else {
      console.log(`✅ IP guardada correctamente: ${row.ipAddress}`);
    }

    const horaRegistro = new Date(row.horaRegistro);
    const horaColRegistro = horaRegistro.toLocaleString('en-CA', { timeZone: 'America/Bogota', hour12: false });
    const horaColAhora = new Date().toLocaleString('en-CA', { timeZone: 'America/Bogota', hour12: false });
    console.log(`Hora Colombia registro: ${horaColRegistro}, ahora: ${horaColAhora}`);
    if (horaColRegistro.slice(0, 16) === horaColAhora.slice(0, 16)) {
      console.log('✅ Hora de registro coincide con hora Colombia (precisión minuto)');
    } else {
      console.error('❌ Hora de registro NO coincide con hora Colombia');
      ok = false;
    }
  }

  // Limpieza
  console.log('Limpiando datos de prueba...');
  await tenantPool.query('DELETE FROM asistencia_registros WHERE "sesionId" = $1', [sesionId]);
  await tenantPool.query('DELETE FROM asistencia_sesiones WHERE id = $1', [sesionId]);

  const aprendizTenantId = aprendiz.user.perfilId;
  const basePhotoPath = path.resolve(__dirname, 'uploads', 'faces', 'base', `${aprendizTenantId}.jpg`);
  const attendancePhotoPath = path.resolve(__dirname, 'uploads', 'faces', 'attendance', `${aprendizTenantId}.jpg`);
  if (fs.existsSync(basePhotoPath)) fs.unlinkSync(basePhotoPath);
  if (fs.existsSync(attendancePhotoPath)) fs.unlinkSync(attendancePhotoPath);

  await tenantPool.query(
    'UPDATE persona_orm_entity SET face_photo_path = NULL, face_embedding = NULL, last_attendance_photo_path = NULL WHERE id_persona = $1',
    [aprendizTenantId]
  );

  console.log('Restaurando passwords originales...');
  await updatePassword(APRENDIZ_LOGIN, ORIGINAL_HASH);
  await updatePassword(INSTRUCTOR_LOGIN, ORIGINAL_HASH);

  await masterPool.end();
  await tenantPool.end();

  console.log(ok ? '\n✅ PRUEBA COMPLETADA CON ÉXITO' : '\n❌ PRUEBA COMPLETADA CON ERRORES');
  process.exit(ok ? 0 : 1);
}

main().catch(async (err) => {
  console.error('\nError en prueba:', err.response?.data || err.message || err);
  try {
    console.log('Restaurando passwords originales tras error...');
    await updatePassword(APRENDIZ_LOGIN, ORIGINAL_HASH);
    await updatePassword(INSTRUCTOR_LOGIN, ORIGINAL_HASH);
  } catch (e) {
    console.error('No se pudieron restaurar passwords:', e.message);
  }
  await masterPool.end();
  await tenantPool.end();
  process.exit(1);
});
