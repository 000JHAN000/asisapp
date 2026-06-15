// infrastructure/adapters/sede.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SedeRepositoryPort } from '../../domain/ports/sede.repository.port';
import { Sede } from '../../domain/entities/sede.entity';
import { SedeOrmEntity } from '../entities/sede.orm-entity';

@Injectable()
export class SedeTypeOrmRepository implements SedeRepositoryPort {

  constructor(
    @InjectRepository(SedeOrmEntity)
    private readonly repo: Repository<SedeOrmEntity>,
  ) {}

  crear(datos: Partial<Sede>): Promise<Sede> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Sede[]> {
    return this.repo.find({ relations: ['centro'] });
  }

  async buscarPorId(id: string): Promise<Sede> {
    const encontrado = await this.repo.findOneBy({ id_sede: id });
    if (!encontrado) throw new NotFoundException(`Sede ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Sede>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}