// application/acceso.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type AccesoRepositoryPort, ACCESO_REPOSITORY } from '../domain/ports/acceso.repository.port';
import { CreateAccesoDto } from '../infrastructure/http/dto/create-acceso.dto';
import { UpdateAccesoDto } from '../infrastructure/http/dto/update-acceso.dto';

@Injectable()
export class AccesoService {

  constructor(
    @Inject(ACCESO_REPOSITORY)
    private readonly repo: AccesoRepositoryPort,
  ) {}

  create(dto: CreateAccesoDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateAccesoDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}