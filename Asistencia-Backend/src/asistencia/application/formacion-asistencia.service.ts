import { Inject, Injectable } from '@nestjs/common';
import { type FormacionAsistenciaRepositoryPort, FORMACION_ASISTENCIA_REPOSITORY } from '../domain/ports/formacion-asistencia.repository.port';
import { CreateFormacionAsistenciaDto } from '../infrastructure/http/dto/create-formacion-asistencia.dto';
import { UpdateFormacionAsistenciaDto } from '../infrastructure/http/dto/update-formacion-asistencia.dto';

/**
 * @deprecated Legacy: servicio sobre `formacion_asistencia` de `sena_db`.
 */
@Injectable()
export class FormacionAsistenciaService {

  constructor(
    @Inject(FORMACION_ASISTENCIA_REPOSITORY)
    private readonly repo: FormacionAsistenciaRepositoryPort,
  ) {}

  create(dto: CreateFormacionAsistenciaDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateFormacionAsistenciaDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}
