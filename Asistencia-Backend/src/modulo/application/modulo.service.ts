// application/modulo.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type ModuloRepositoryPort, MODULO_REPOSITORY } from '../domain/ports/modulo.repository.port';
import { CreateModuloDto } from '../infrastructure/http/dto/create-modulo.dto';
import { UpdateModuloDto } from '../infrastructure/http/dto/update-modulo.dto';

@Injectable()
export class ModuloService {

  constructor(
    @Inject(MODULO_REPOSITORY)
    private readonly repo: ModuloRepositoryPort,
  ) {}

  create(dto: CreateModuloDto) {
    return this.repo.crear(dto);
  }

  findAll(aplicativoId: string) {
  return this.repo.listarPorAplicativo(aplicativoId);
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateModuloDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}