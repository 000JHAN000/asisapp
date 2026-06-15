import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormacionAsistenciaRepositoryPort } from '../../domain/ports/formacion-asistencia.repository.port';
import { FormacionAsistencia } from '../../domain/entities/formacion-asistencia.entity';
import { FormacionAsistenciaOrmEntity } from '../entities/formacion-asistencia.orm-entity';

@Injectable()
export class FormacionAsistenciaTypeOrmRepository implements FormacionAsistenciaRepositoryPort {

  constructor(
    @InjectRepository(FormacionAsistenciaOrmEntity)
    private readonly repo: Repository<FormacionAsistenciaOrmEntity>,
  ) {}

  crear(datos: Partial<FormacionAsistencia>): Promise<FormacionAsistencia> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<FormacionAsistencia[]> {
    return this.repo.find({ relations: ['horario', 'configuracion', 'asistencias'] });
  }

  async buscarPorId(id: string): Promise<FormacionAsistencia> {
    const encontrado = await this.repo.findOne({
      where: { id_formacion: id },
      relations: ['horario', 'configuracion', 'asistencias'],
    });
    if (!encontrado) throw new NotFoundException(`Formación ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<FormacionAsistencia>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}
