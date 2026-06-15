// infrastructure/adapters/departamento.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartamentoRepositoryPort } from '../../domain/ports/departamento.repository.port';
import { Departamento } from '../../domain/entities/departamento.entity';
import { DepartamentoOrmEntity } from '../entities/departamento.orm-entity';

@Injectable()
export class DepartamentoTypeOrmRepository implements DepartamentoRepositoryPort {

constructor(
    @InjectRepository(DepartamentoOrmEntity)
    private readonly repo: Repository<DepartamentoOrmEntity>,
) {}

crear(datos: Partial<Departamento>): Promise<Departamento> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
}

listar(): Promise<Departamento[]> {
    return this.repo.find({ relations: ['municipio'] });
}

async buscarPorId(id: string): Promise<Departamento> {
    const encontrado = await this.repo.findOneBy({ id_departamento: id });
    if (!encontrado) throw new NotFoundException(`Departamento ${id} no existe`);
    return encontrado;
}

async actualizar(id: string, datos: Partial<Departamento>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
}

async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
}
}