INSERT INTO cg_configuracion (id, "pinRegistro") VALUES ('ad40b260-0459-4c02-9ac4-e944d24c7488', '1234');

INSERT INTO cg_fichas (id, codigo, programa, area, "fechaInicio", "fechaFin", "intensidadHoraria")
VALUES ('9a8b516c-9c0a-4820-a55b-74ab906782f3', 'PALM123', 'Tecnólogo en Pruebas Palmira', 'TIC', '2025-01-20', '2026-12-15', 12);

INSERT INTO cg_ambientes (id, nombre, capacidad, tipo, area)
VALUES ('2b65f9c0-724b-4e79-a979-e828a23c35bc', 'Ambiente Palmira Test', 30, 'aula', 'TIC');

INSERT INTO cg_instructores (id, nombre, apellido, correo, documento, "esLider", "esTransversal")
VALUES ('7fd2e283-5a49-464a-9450-12fdf31698cf', 'Instructor', 'Palmira', 'instructor@palmira.com', '88888', false, false);

INSERT INTO cg_aprendices (id, nombre, apellido, correo, documento, "fichaId", "facePhotoPath")
VALUES ('0cf12eed-f29e-4a9c-97c2-9c07a7f06b03', 'Aprendiz', 'Palmira', 'aprendiz@palmira.com', '99999', '9a8b516c-9c0a-4820-a55b-74ab906782f3', NULL);

INSERT INTO cg_horarios (id, "diaSemana", jornada, "horaInicio", "horaFin", "fichaId", "instructorId", "ambienteId", activo, estado, "minutosRetraso")
VALUES ('087cc0a8-822a-4ec7-8cbf-d34085e7cc6a', 'miercoles', 'manana', '08:00:00', '12:00:00', '9a8b516c-9c0a-4820-a55b-74ab906782f3', '7fd2e283-5a49-464a-9450-12fdf31698cf', '2b65f9c0-724b-4e79-a979-e828a23c35bc', true, 'programado', 0);
