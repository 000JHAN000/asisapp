// infrastructure/adapters/municipio.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MunicipioRepositoryPort } from '../../domain/ports/municipio.repository.port';
import { Municipio } from '../../domain/entities/municipio.entity';
import { MunicipioOrmEntity } from '../entities/municipio.orm-entity';

@Injectable()
export class MunicipioTypeOrmRepository implements MunicipioRepositoryPort {

constructor(
    @InjectRepository(MunicipioOrmEntity)
    private readonly repo: Repository<MunicipioOrmEntity>,
) {}

  crear(datos: Partial<Municipio>): Promise<Municipio> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
}

  listar(): Promise<Municipio[]> {
    return this.repo.find({ relations: ['departamento'] });
}

  async buscarPorId(id: string): Promise<Municipio> {
    const encontrado = await this.repo.findOneBy({ id_municipio: id });
    if (!encontrado) throw new NotFoundException(`Municipio ${id} no existe`);
    return encontrado;
}

  async actualizar(id: string, datos: Partial<Municipio>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
}

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
}
}