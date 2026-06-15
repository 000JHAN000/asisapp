// application/rol.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type RolRepositoryPort, ROL_REPOSITORY } from '../domain/ports/rol.repository.port';
import { CreateRolDto } from '../infrastructure/http/dto/create-rol.dto';
import { UpdateRolDto } from '../infrastructure/http/dto/update-rol.dto';

@Injectable()
export class RolService {

  constructor(
    @Inject(ROL_REPOSITORY)
    private readonly repo: RolRepositoryPort,
  ) {}

  create(dto: CreateRolDto) {
    return this.repo.crear(dto);
  }

  findAll(aplicativoId: string) {
  return this.repo.listarPorAplicativo(aplicativoId);
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateRolDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}