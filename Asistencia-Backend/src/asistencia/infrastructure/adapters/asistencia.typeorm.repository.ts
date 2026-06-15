import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsistenciaRepositoryPort } from '../../domain/ports/asistencia.repository.port';
import { Asistencia } from '../../domain/entities/asistencia.entity';
import { AsistenciaOrmEntity } from '../entities/asistencia.orm-entity';

@Injectable()
export class AsistenciaTypeOrmRepository implements AsistenciaRepositoryPort {

  constructor(
    @InjectRepository(AsistenciaOrmEntity)
    private readonly repo: Repository<AsistenciaOrmEntity>,
  ) {}

  crear(datos: Partial<Asistencia>): Promise<Asistencia> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<Asistencia[]> {
    return this.repo.find({ relations: ['formacion'] });
  }

  async buscarPorId(id: string): Promise<Asistencia> {
    const encontrado = await this.repo.findOne({
      where: { id_asistencia: id },
      relations: ['formacion'],
    });
    if (!encontrado) throw new NotFoundException(`Asistencia ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Asistencia>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}
