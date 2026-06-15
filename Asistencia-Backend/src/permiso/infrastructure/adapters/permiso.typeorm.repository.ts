// infrastructure/adapters/permiso.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermisoRepositoryPort } from '../../domain/ports/permiso.repository.port';
import { Permiso } from '../../domain/entities/permiso.entity';
import { PermisoOrmEntity } from '../entities/permiso.orm-entity';

@Injectable()
export class PermisoTypeOrmRepository implements PermisoRepositoryPort {

  constructor(
    @InjectRepository(PermisoOrmEntity)
    private readonly repo: Repository<PermisoOrmEntity>,
  ) {}

  crear(datos: Partial<Permiso>): Promise<Permiso> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Permiso[]> {
    return this.repo.find({ relations: ['usuario', 'rol', 'servicio'] });
  }

  async buscarPorId(id: string): Promise<Permiso> {
    const encontrado = await this.repo.findOneBy({ id_permiso: id });
    if (!encontrado) throw new NotFoundException(`Permiso ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Permiso>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}