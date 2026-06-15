// infrastructure/adapters/acceso.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccesoRepositoryPort } from '../../domain/ports/acceso.repository.port';
import { Acceso } from '../../domain/entities/acceso.entity';
import { AccesoOrmEntity } from '../entities/acceso.orm-entity';

@Injectable()
export class AccesoTypeOrmRepository implements AccesoRepositoryPort {

  constructor(
    @InjectRepository(AccesoOrmEntity)
    private readonly repo: Repository<AccesoOrmEntity>,
  ) {}

  crear(datos: Partial<Acceso>): Promise<Acceso> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Acceso[]> {
    return this.repo.find({ relations: ['usuario'] });
  }

  async buscarPorId(id: string): Promise<Acceso> {
    const encontrado = await this.repo.findOneBy({ id_acceso: id });
    if (!encontrado) throw new NotFoundException(`Acceso ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Acceso>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}