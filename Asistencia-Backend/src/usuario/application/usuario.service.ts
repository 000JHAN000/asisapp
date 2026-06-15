// application/usuario.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { type UsuarioRepositoryPort, USUARIO_REPOSITORY } from '../domain/ports/usuario.repository.port';
import { CreateUsuarioDto } from '../infrastructure/http/dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../infrastructure/http/dto/update-usuario.dto';

@Injectable()
export class UsuarioService {

  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly repo: UsuarioRepositoryPort,
  ) {}

  create(dto: CreateUsuarioDto) {
    return this.repo.crear(dto);
  }

  findAll(aplicativoId: string) {
    return this.repo.listarPorAplicativo(aplicativoId);
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateUsuarioDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}