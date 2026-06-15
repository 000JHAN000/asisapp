// application/persona.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type PersonaRepositoryPort, PERSONA_REPOSITORY } from '../domain/ports/persona.repository.port';
import { CreatePersonaDto } from '../infrastructure/http/dto/create-persona.dto';
import { UpdatePersonaDto } from '../infrastructure/http/dto/update-persona.dto';

@Injectable()
export class PersonaService {

  constructor(
    @Inject(PERSONA_REPOSITORY)
    private readonly repo: PersonaRepositoryPort,
  ) {}

  create(dto: CreatePersonaDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdatePersonaDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}