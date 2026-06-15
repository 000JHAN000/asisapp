import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatriculaRepositoryPort } from '../../domain/ports/matricula.repository.port';
import { Matricula } from '../../domain/entities/matricula.entity';
import { MatriculaOrmEntity } from '../entities/matricula.orm-entity';

@Injectable()
export class MatriculaTypeOrmRepository implements MatriculaRepositoryPort {

  constructor(
    @InjectRepository(MatriculaOrmEntity)
    private readonly repo: Repository<MatriculaOrmEntity>,
  ) {}

  crear(datos: Partial<Matricula>): Promise<Matricula> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(cursoFk?: string): Promise<Matricula[]> {
  return this.repo.find({
    where: cursoFk ? { curso_fk: cursoFk } : {},
    relations: ['persona', 'curso'],
  });
}

  async buscarPorId(id: string): Promise<Matricula> {
    const encontrado = await this.repo.findOneBy({ id_matricula: id });
    if (!encontrado) throw new NotFoundException(`Matricula ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Matricula>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}