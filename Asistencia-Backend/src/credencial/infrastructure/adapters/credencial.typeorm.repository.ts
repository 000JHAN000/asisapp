// infrastructure/adapters/credencial.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CredencialRepositoryPort } from '../../domain/ports/credencial.repository.port';
import { Credencial } from '../../domain/entities/credencial.entity';
import { CredencialOrmEntity } from '../entities/credencial.orm-entity';

@Injectable()
export class CredencialTypeOrmRepository implements CredencialRepositoryPort {

  constructor(
    @InjectRepository(CredencialOrmEntity)
    private readonly repo: Repository<CredencialOrmEntity>,
  ) {}

  crear(datos: Partial<Credencial>): Promise<Credencial> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Credencial[]> {
    return this.repo.find({ relations: ['rol', 'usuario'] });
  }

  async buscarPorId(id: string): Promise<Credencial> {
    const encontrado = await this.repo.findOneBy({ id_credencial: id });
    if (!encontrado) throw new NotFoundException(`Credencial ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Credencial>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}