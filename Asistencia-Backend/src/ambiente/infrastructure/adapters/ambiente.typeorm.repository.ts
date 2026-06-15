// infrastructure/adapters/ambiente.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmbienteRepositoryPort } from '../../domain/ports/ambiente.repository.port';
import { Ambiente } from '../../domain/entities/ambiente.entity';
import { AmbienteOrmEntity } from '../entities/ambiente.orm-entity';

@Injectable()
export class AmbienteTypeOrmRepository implements AmbienteRepositoryPort {

  constructor(
    @InjectRepository(AmbienteOrmEntity)
    private readonly repo: Repository<AmbienteOrmEntity>,
  ) {}

  crear(datos: Partial<Ambiente>): Promise<Ambiente> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Ambiente[]> {
    return this.repo.find({ relations: ['area'] });
  }

  async buscarPorId(id: string): Promise<Ambiente> {
    const encontrado = await this.repo.findOneBy({ id_ambiente: id });
    if (!encontrado) throw new NotFoundException(`Ambiente ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Ambiente>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}