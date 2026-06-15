// application/programa.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type ProgramaRepositoryPort, PROGRAMA_REPOSITORY } from '../domain/ports/programa.repository.port';
import { CreateProgramaDto } from '../infrastructure/http/dto/create-programa.dto';
import { UpdateProgramaDto } from '../infrastructure/http/dto/update-programa.dto';

@Injectable()
export class ProgramaService {

  constructor(
    @Inject(PROGRAMA_REPOSITORY)
    private readonly repo: ProgramaRepositoryPort,
  ) {}

  create(dto: CreateProgramaDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateProgramaDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}