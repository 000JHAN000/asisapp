import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmbienteCG } from '../entities/ambiente-cg.entity';

@Injectable()
export class AmbientesService {
  constructor(
    @InjectRepository(AmbienteCG)
    private readonly repo: Repository<AmbienteCG>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  create(data: any) {
    return this.repo.save(data);
  }

  async update(id: string, data: any) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { success: true };
  }

  async findDisponibilidad(dia: string, jornada: string) {
    const ambientes = await this.repo.find();
    return ambientes.map((ambiente) => ({
      ...ambiente,
      disponible: true,
    }));
  }

  async findLibresAhora() {
    return this.repo.find();
  }
}
