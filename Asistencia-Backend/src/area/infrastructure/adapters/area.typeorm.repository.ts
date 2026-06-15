// infrastructure/adapters/area.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaRepositoryPort } from '../../domain/ports/area.repository.port';
import { Area } from '../../domain/entities/area.entity';
import { AreaOrmEntity } from '../entities/area.orm-entity';

@Injectable()
export class AreaTypeOrmRepository implements AreaRepositoryPort {

  constructor(
    @InjectRepository(AreaOrmEntity)
    private readonly repo: Repository<AreaOrmEntity>,
  ) {}

  crear(datos: Partial<Area>): Promise<Area> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Area[]> {
    return this.repo.find({ relations: ['sede'] });
  }

  async buscarPorId(id: string): Promise<Area> {
    const encontrado = await this.repo.findOneBy({ id_area: id });
    if (!encontrado) throw new NotFoundException(`Area ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Area>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}