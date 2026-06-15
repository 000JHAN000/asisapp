// infrastructure/adapters/curso.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CursoRepositoryPort } from '../../domain/ports/curso.repository.port';
import { Curso } from '../../domain/entities/curso.entity';
import { CursoOrmEntity } from '../entities/curso.orm-entity';

@Injectable()
export class CursoTypeOrmRepository implements CursoRepositoryPort {

  constructor(
    @InjectRepository(CursoOrmEntity)
    private readonly repo: Repository<CursoOrmEntity>,
  ) {}

  crear(datos: Partial<Curso>): Promise<Curso> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Curso[]> {
    return this.repo.find({ relations: ['area', 'programa'] });
  }

  async buscarPorId(id: string): Promise<Curso> {
    const encontrado = await this.repo.findOneBy({ id_curso: id });
    if (!encontrado) throw new NotFoundException(`Curso ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Curso>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}