// infrastructure/adapters/rol.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolRepositoryPort } from '../../domain/ports/rol.repository.port';
import { Rol } from '../../domain/entities/rol.entity';
import { RolOrmEntity } from '../entities/rol.orm-entity';

@Injectable()
export class RolTypeOrmRepository implements RolRepositoryPort {

  constructor(
    @InjectRepository(RolOrmEntity)
    private readonly repo: Repository<RolOrmEntity>,
  ) {}

  crear(datos: Partial<Rol>): Promise<Rol> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Rol[]> {
    return this.repo.find({ relations: ['aplicativo'] });
  }

  listarPorAplicativo(aplicativoId: string): Promise<Rol[]> {
  return this.repo.find({
    where: { aplicativo_fk: aplicativoId },
    relations: ['aplicativo'],
  });
}

  async buscarPorId(id: string): Promise<Rol> {
    const encontrado = await this.repo.findOneBy({ id_rol: id });
    if (!encontrado) throw new NotFoundException(`Rol ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Rol>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}