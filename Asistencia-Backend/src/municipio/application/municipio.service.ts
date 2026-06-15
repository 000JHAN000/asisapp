// application/municipio.service.ts

import { Inject, Injectable } from '@nestjs/common';
import {
  type MunicipioRepositoryPort,
  MUNICIPIO_REPOSITORY,
} from '../domain/ports/municipio.repository.port';
import { CreateMunicipioDto } from '../infrastructure/http/dto/create-municipio.dto';
import { UpdateMunicipioDto } from '../infrastructure/http/dto/update-municipio.dto';

@Injectable()
export class MunicipioService {

  constructor(
    @Inject(MUNICIPIO_REPOSITORY)
    private readonly repo: MunicipioRepositoryPort,
  ) {}

  create(dto: CreateMunicipioDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateMunicipioDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}