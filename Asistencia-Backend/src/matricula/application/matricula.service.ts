// application/matricula.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type MatriculaRepositoryPort, MATRICULA_REPOSITORY } from '../domain/ports/matricula.repository.port';
import { CreateMatriculaDto } from '../infrastructure/http/dto/create-matricula.dto';
import { UpdateMatriculaDto } from '../infrastructure/http/dto/update-matricula.dto';

@Injectable()
export class MatriculaService {

  constructor(
    @Inject(MATRICULA_REPOSITORY)
    private readonly repo: MatriculaRepositoryPort,
  ) {}

  create(dto: CreateMatriculaDto) {
    return this.repo.crear(dto);
  }

  findAll(cursoFk?: string) {
  return this.repo.listar(cursoFk);
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateMatriculaDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}