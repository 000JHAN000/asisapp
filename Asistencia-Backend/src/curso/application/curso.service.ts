// application/curso.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type CursoRepositoryPort, CURSO_REPOSITORY } from '../domain/ports/curso.repository.port';
import { CreateCursoDto } from '../infrastructure/http/dto/create-curso.dto';
import { UpdateCursoDto } from '../infrastructure/http/dto/update-curso.dto';

@Injectable()
export class CursoService {

  constructor(
    @Inject(CURSO_REPOSITORY)
    private readonly repo: CursoRepositoryPort,
  ) {}

  create(dto: CreateCursoDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateCursoDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}