SELECT id, "sesionId", "aprendizId", estado, "facePhotoPath", "firmaImagen" IS NOT NULL as tiene_firma, "horaRegistro" FROM asistencia_registros ORDER BY "horaRegistro" DESC LIMIT 5;
