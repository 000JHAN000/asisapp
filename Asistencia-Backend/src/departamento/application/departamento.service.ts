// application/departamento.service.ts

import { Inject, Injectable } from '@nestjs/common';

import type { CreateDepartamentoDto } from '../infrastructure/http/dto/create-departamento.dto';
import type { UpdateDepartamentoDto } from '../infrastructure/http/dto/update-departamento.dto';

import {
  DEPARTAMENTO_REPOSITORY,
  type DepartamentoRepositoryPort,
} from '../domain/ports/departamento.repository.port';

@Injectable()
export class DepartamentoService {

  constructor(
    @Inject(DEPARTAMENTO_REPOSITORY)
    private readonly repo: DepartamentoRepositoryPort,
  ) {}

  create(dto: CreateDepartamentoDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateDepartamentoDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}