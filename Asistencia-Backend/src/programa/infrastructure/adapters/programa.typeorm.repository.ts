// infrastructure/adapters/programa.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramaRepositoryPort } from '../../domain/ports/programa.repository.port';
import { Programa } from '../../domain/entities/programa.entity';
import { ProgramaOrmEntity } from '../entities/programa.orm-entity';

@Injectable()
export class ProgramaTypeOrmRepository implements ProgramaRepositoryPort {

  constructor(
    @InjectRepository(ProgramaOrmEntity)
    private readonly repo: Repository<ProgramaOrmEntity>,
  ) {}

  crear(datos: Partial<Programa>): Promise<Programa> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Programa[]> {
    return this.repo.find({ relations: ['cursos'] });
  }

  async buscarPorId(id: string): Promise<Programa> {
    const encontrado = await this.repo.findOneBy({ id_programa: id });
    if (!encontrado) throw new NotFoundException(`Programa ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Programa>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}