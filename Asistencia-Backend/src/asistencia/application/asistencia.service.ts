import { Inject, Injectable } from '@nestjs/common';
import { type AsistenciaRepositoryPort, ASISTENCIA_REPOSITORY } from '../domain/ports/asistencia.repository.port';
import { CreateAsistenciaDto } from '../infrastructure/http/dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from '../infrastructure/http/dto/update-asistencia.dto';

/**
 * @deprecated Legacy: servicio sobre `asistencia` de `sena_db`.
 * El flujo facial actual usa `AsistenciaSesionService` y `AsistenciaRegistroService`.
 */
@Injectable()
export class AsistenciaService {

  constructor(
    @Inject(ASISTENCIA_REPOSITORY)
    private readonly repo: AsistenciaRepositoryPort,
  ) {}

  create(dto: CreateAsistenciaDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateAsistenciaDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}
