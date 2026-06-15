// application/permiso.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type PermisoRepositoryPort, PERMISO_REPOSITORY } from '../domain/ports/permiso.repository.port';
import { CreatePermisoDto } from '../infrastructure/http/dto/create-permiso.dto';
import { UpdatePermisoDto } from '../infrastructure/http/dto/update-permiso.dto';

@Injectable()
export class PermisoService {

  constructor(
    @Inject(PERMISO_REPOSITORY)
    private readonly repo: PermisoRepositoryPort,
  ) {}

  create(dto: CreatePermisoDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdatePermisoDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}