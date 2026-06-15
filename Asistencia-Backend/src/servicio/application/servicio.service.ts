// application/servicio.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type ServicioRepositoryPort, SERVICIO_REPOSITORY } from '../domain/ports/servicio.repository.port';
import { CreateServicioDto } from '../infrastructure/http/dto/create-servicio.dto';
import { UpdateServicioDto } from '../infrastructure/http/dto/update-servicio.dto';

@Injectable()
export class ServicioService {

  constructor(
    @Inject(SERVICIO_REPOSITORY)
    private readonly repo: ServicioRepositoryPort,
  ) {}

  create(dto: CreateServicioDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateServicioDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}