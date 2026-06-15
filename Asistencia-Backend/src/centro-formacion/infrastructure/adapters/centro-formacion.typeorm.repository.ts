// infrastructure/adapters/centro-formacion.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CentroFormacionRepositoryPort } from '../../domain/ports/centro-formacion.repository.port';
import { CentroFormacion } from '../../domain/entities/centro-formacion.entity';
import { CentroFormacionOrmEntity } from '../entities/centro-formacion.orm-entity';

@Injectable()
export class CentroFormacionTypeOrmRepository implements CentroFormacionRepositoryPort {

  constructor(
    @InjectRepository(CentroFormacionOrmEntity)
    private readonly repo: Repository<CentroFormacionOrmEntity>,
  ) {}

  crear(datos: Partial<CentroFormacion>): Promise<CentroFormacion> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<CentroFormacion[]> {
    return this.repo.find({ relations: ['municipio'] });
  }

  async buscarPorId(id: string): Promise<CentroFormacion> {
    const encontrado = await this.repo.findOneBy({ id_centro: id });
    if (!encontrado) throw new NotFoundException(`Centro de formación ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<CentroFormacion>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}