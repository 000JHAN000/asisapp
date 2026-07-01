import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HorarioRepositoryPort } from '../../domain/ports/horario.repository.port';
import { Horario } from '../../domain/entities/horario.entity';
import { HorarioOrmEntity } from '../entities/horario.orm-entity';

@Injectable()
export class HorarioTypeOrmRepository implements HorarioRepositoryPort {

  constructor(
    @InjectRepository(HorarioOrmEntity)
    private readonly repo: Repository<HorarioOrmEntity>,
  ) {}

  crear(datos: Partial<Horario>): Promise<Horario> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo) as any;
  }

  listar(): Promise<Horario[]> {
    return this.repo.find({ relations: ['curso', 'ambiente'] }) as any;
  }

  async buscarPorId(id: string): Promise<Horario> {
    const encontrado = await this.repo.findOne({
      where: { id_horario: id },
      relations: ['curso', 'ambiente'],
    });
    if (!encontrado) throw new NotFoundException(`Horario ${id} no existe`);
    return encontrado as any;
  }

  async actualizar(id: string, datos: Partial<Horario>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}
