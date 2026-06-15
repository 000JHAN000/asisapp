// infrastructure/adapters/servicio.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicioRepositoryPort } from '../../domain/ports/servicio.repository.port';
import { Servicio } from '../../domain/entities/servicio.entity';
import { ServicioOrmEntity } from '../entities/servicio.orm-entity';

@Injectable()
export class ServicioTypeOrmRepository implements ServicioRepositoryPort {

  constructor(
    @InjectRepository(ServicioOrmEntity)
    private readonly repo: Repository<ServicioOrmEntity>,
  ) {}

  crear(datos: Partial<Servicio>): Promise<Servicio> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Servicio[]> {
    return this.repo.find({ relations: ['modulo'] });
  }

  async buscarPorId(id: string): Promise<Servicio> {
    const encontrado = await this.repo.findOneBy({ id_servicio: id });
    if (!encontrado) throw new NotFoundException(`Servicio ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Servicio>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}