// application/aplicativo.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type AplicativoRepositoryPort, APLICATIVO_REPOSITORY } from '../domain/ports/aplicativo.repository.port';
import { CreateAplicativoDto } from '../infrastructure/http/dto/create-aplicativo.dto';
import { UpdateAplicativoDto } from '../infrastructure/http/dto/update-aplicativo.dto';

@Injectable()
export class AplicativoService {

  constructor(
    @Inject(APLICATIVO_REPOSITORY)
    private readonly repo: AplicativoRepositoryPort,
  ) {}

  create(dto: CreateAplicativoDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateAplicativoDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}