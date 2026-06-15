// application/sede.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type SedeRepositoryPort, SEDE_REPOSITORY } from '../domain/ports/sede.repository.port';
import { CreateSedeDto } from '../infrastructure/http/dto/create-sede.dto';
import { UpdateSedeDto } from '../infrastructure/http/dto/update-sede.dto';

@Injectable()
export class SedeService {

  constructor(
    @Inject(SEDE_REPOSITORY)
    private readonly repo: SedeRepositoryPort,
  ) {}

  create(dto: CreateSedeDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateSedeDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}