// infrastructure/adapters/aplicativo.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AplicativoRepositoryPort } from '../../domain/ports/aplicativo.repository.port';
import { Aplicativo } from '../../domain/entities/aplicativo.entity';
import { AplicativoOrmEntity } from '../entities/aplicativo.orm-entity';

@Injectable()
export class AplicativoTypeOrmRepository implements AplicativoRepositoryPort {

  constructor(
    @InjectRepository(AplicativoOrmEntity)
    private readonly repo: Repository<AplicativoOrmEntity>,
  ) {}

  crear(datos: Partial<Aplicativo>): Promise<Aplicativo> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Aplicativo[]> {
    return this.repo.find();
  }

  async buscarPorId(id: string): Promise<Aplicativo> {
    const encontrado = await this.repo.findOneBy({ id_aplicativo: id });
    if (!encontrado) throw new NotFoundException(`Aplicativo ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Aplicativo>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}