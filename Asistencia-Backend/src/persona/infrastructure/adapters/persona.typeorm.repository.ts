// infrastructure/adapters/persona.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonaRepositoryPort } from '../../domain/ports/persona.repository.port';
import { Persona } from '../../domain/entities/persona.entity';
import { PersonaOrmEntity } from '../entities/persona.orm-entity';

@Injectable()
export class PersonaTypeOrmRepository implements PersonaRepositoryPort {

  constructor(
    @InjectRepository(PersonaOrmEntity)
    private readonly repo: Repository<PersonaOrmEntity>,
  ) {}

  crear(datos: Partial<Persona>): Promise<Persona> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Persona[]> {
    return this.repo.find({ relations: ['municipio', 'matriculas'] });
  }

  async buscarPorId(id: string): Promise<Persona> {
    const encontrado = await this.repo.findOneBy({ id_persona: id });
    if (!encontrado) throw new NotFoundException(`Persona ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Persona>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}