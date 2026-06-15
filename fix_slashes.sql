UPDATE cg_aprendices
SET "facePhotoPath" = REPLACE("facePhotoPath", '\', '/')
WHERE "facePhotoPath" LIKE '/app/uploads/%';

UPDATE asistencia_registros
SET "facePhotoPath" = REPLACE("facePhotoPath", '\', '/')
WHERE "facePhotoPath" LIKE '/app/uploads/%';

SELECT id, documento, "facePhotoPath" FROM cg_aprendices WHERE "facePhotoPath" LIKE '/app/uploads/%';
