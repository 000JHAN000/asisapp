import { Inject, Injectable } from '@nestjs/common';
import { type ConfiguracionAsistenciaRepositoryPort, CONFIGURACION_ASISTENCIA_REPOSITORY } from '../domain/ports/configuracion-asistencia.repository.port';
import { CreateConfiguracionAsistenciaDto } from '../infrastructure/http/dto/create-configuracion-asistencia.dto';
import { UpdateConfiguracionAsistenciaDto } from '../infrastructure/http/dto/update-configuracion-asistencia.dto';

/**
 * @deprecated Legacy: servicio sobre `configuracion_asistencia` de `sena_db`.
 */
@Injectable()
export class ConfiguracionAsistenciaService {

  constructor(
    @Inject(CONFIGURACION_ASISTENCIA_REPOSITORY)
    private readonly repo: ConfiguracionAsistenciaRepositoryPort,
  ) {}

  create(dto: CreateConfiguracionAsistenciaDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateConfiguracionAsistenciaDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}
