INSERT INTO cg_configuracion (id, "pinRegistro") VALUES ('11111111-1111-1111-1111-111111111111', '1234');

INSERT INTO cg_fichas (id, codigo, programa, area, "fechaInicio", "fechaFin", "intensidadHoraria")
VALUES ('22222222-2222-2222-2222-222222222222', 'TEST123', 'Tecnólogo en Pruebas', 'TIC', '2025-01-20', '2026-12-15', 12);

INSERT INTO cg_instructores (id, nombre, apellido, correo, documento, "esLider", "esTransversal")
VALUES ('33333333-3333-3333-3333-333333333333', 'Instructor', 'Test', 'instructor@caldas.com', '11111', false, false);

INSERT INTO cg_aprendices (id, nombre, apellido, correo, documento, "fichaId", "facePhotoPath")
VALUES ('44444444-4444-4444-4444-444444444444', 'Aprendiz', 'Test', 'aprendiz@caldas.com', '22222', '22222222-2222-2222-2222-222222222222', NULL);

INSERT INTO cg_horarios (id, "diaSemana", jornada, "horaInicio", "horaFin", "fichaId", "instructorId", "ambienteId", activo, estado, "minutosRetraso")
VALUES ('55555555-5555-5555-5555-555555555555', 'lunes', 'manana', '08:00:00', '12:00:00', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', true, 'programado', 0);

INSERT INTO cg_ambientes (id, nombre, capacidad, tipo, area)
VALUES ('66666666-6666-6666-6666-666666666666', 'Ambiente Test', 30, 'aula', 'TIC');
