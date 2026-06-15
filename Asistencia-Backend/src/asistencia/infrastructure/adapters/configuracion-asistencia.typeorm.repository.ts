import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionAsistenciaRepositoryPort } from '../../domain/ports/configuracion-asistencia.repository.port';
import { ConfiguracionAsistencia } from '../../domain/entities/configuracion-asistencia.entity';
import { ConfiguracionAsistenciaOrmEntity } from '../entities/configuracion-asistencia.orm-entity';

@Injectable()
export class ConfiguracionAsistenciaTypeOrmRepository implements ConfiguracionAsistenciaRepositoryPort {

  constructor(
    @InjectRepository(ConfiguracionAsistenciaOrmEntity)
    private readonly repo: Repository<ConfiguracionAsistenciaOrmEntity>,
  ) {}

  crear(datos: Partial<ConfiguracionAsistencia>): Promise<ConfiguracionAsistencia> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listar(): Promise<ConfiguracionAsistencia[]> {
    return this.repo.find({ relations: ['matricula'] });
  }

  async buscarPorId(id: string): Promise<ConfiguracionAsistencia> {
    const encontrado = await this.repo.findOne({
      where: { id_configuracion: id },
      relations: ['matricula'],
    });
    if (!encontrado) throw new NotFoundException(`Configuración ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<ConfiguracionAsistencia>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}
