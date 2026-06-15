// application/credencial.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { type CredencialRepositoryPort, CREDENCIAL_REPOSITORY } from '../domain/ports/credencial.repository.port';
import { CreateCredencialDto } from '../infrastructure/http/dto/create-credencial.dto';
import { UpdateCredencialDto } from '../infrastructure/http/dto/update-credencial.dto';

@Injectable()
export class CredencialService {

  constructor(
    @Inject(CREDENCIAL_REPOSITORY)
    private readonly repo: CredencialRepositoryPort,
  ) {}

  async create(dto: CreateCredencialDto) {
    const passwordHash = await hash(dto.password, 10);
    return this.repo.crear({ ...dto, password: passwordHash });
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateCredencialDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}