// application/ambiente.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type AmbienteRepositoryPort, AMBIENTE_REPOSITORY } from '../domain/ports/ambiente.repository.port';
import { CreateAmbienteDto } from '../infrastructure/http/dto/create-ambiente.dto';
import { UpdateAmbienteDto } from '../infrastructure/http/dto/update-ambiente.dto';

@Injectable()
export class AmbienteService {

  constructor(
    @Inject(AMBIENTE_REPOSITORY)
    private readonly repo: AmbienteRepositoryPort,
  ) {}

  create(dto: CreateAmbienteDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateAmbienteDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}