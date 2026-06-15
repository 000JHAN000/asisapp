// application/area.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type AreaRepositoryPort, AREA_REPOSITORY } from '../domain/ports/area.repository.port';
import { CreateAreaDto } from '../infrastructure/http/dto/create-area.dto';
import { UpdateAreaDto } from '../infrastructure/http/dto/update-area.dto';

@Injectable()
export class AreaService {

  constructor(
    @Inject(AREA_REPOSITORY)
    private readonly repo: AreaRepositoryPort,
  ) {}

  create(dto: CreateAreaDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateAreaDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}