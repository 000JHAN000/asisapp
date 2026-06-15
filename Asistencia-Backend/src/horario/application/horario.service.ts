import { Inject, Injectable } from '@nestjs/common';
import { type HorarioRepositoryPort, HORARIO_REPOSITORY } from '../domain/ports/horario.repository.port';
import { CreateHorarioDto } from '../infrastructure/http/dto/create-horario.dto';
import { UpdateHorarioDto } from '../infrastructure/http/dto/update-horario.dto';

@Injectable()
export class HorarioService {

  constructor(
    @Inject(HORARIO_REPOSITORY)
    private readonly repo: HorarioRepositoryPort,
  ) {}

  create(dto: CreateHorarioDto) {
    return this.repo.crear(dto);
  }

  findAll() {
    return this.repo.listar();
  }

  findOne(id: string) {
    return this.repo.buscarPorId(id);
  }

  update(id: string, dto: UpdateHorarioDto) {
    return this.repo.actualizar(id, dto);
  }

  remove(id: string) {
    return this.repo.eliminar(id);
  }
}