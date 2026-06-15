// infrastructure/adapters/modulo.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuloRepositoryPort } from '../../domain/ports/modulo.repository.port';
import { Modulo } from '../../domain/entities/modulo.entity';
import { ModuloOrmEntity } from '../entities/modulo.orm-entity';

@Injectable()
export class ModuloTypeOrmRepository implements ModuloRepositoryPort {

  constructor(
    @InjectRepository(ModuloOrmEntity)
    private readonly repo: Repository<ModuloOrmEntity>,
  ) {}

  crear(datos: Partial<Modulo>): Promise<Modulo> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Modulo[]> {
    return this.repo.find({ relations: ['aplicativo'] });
  }

  listarPorAplicativo(aplicativoId: string): Promise<Modulo[]> {
  return this.repo.find({
    where: { aplicativo_fk: aplicativoId },
    relations: ['aplicativo'],
  });
}

  async buscarPorId(id: string): Promise<Modulo> {
    const encontrado = await this.repo.findOneBy({ id_modulo: id });
    if (!encontrado) throw new NotFoundException(`Modulo ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Modulo>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}