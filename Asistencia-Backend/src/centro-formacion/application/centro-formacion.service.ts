// application/centro-formacion.service.ts

import { Inject, Injectable } from '@nestjs/common';
import {
  type CentroFormacionRepositoryPort,
  CENTRO_FORMACION_REPOSITORY,
} from '../domain/ports/centro-formacion.repository.port';
import { CreateCentroFormacionDto } from '../infrastructure/http/dto/create-centro-formacion.dto';
import { UpdateCentroFormacionDto } from '../infrastructure/http/dto/update-centro-formacion.dto';

@Injectable()
export class CentroFormacionService {

  constructor(
    @Inject(CENTRO_FORMACION_REPOSITORY)
    private readonly repo: CentroFormacionRepositoryPort,
  ) {}

  create(dto: CreateCentroFormacionDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateCentroFormacionDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}