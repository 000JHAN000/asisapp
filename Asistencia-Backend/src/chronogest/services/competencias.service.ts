import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Competencia } from '../entities/competencia.entity';
import { HorarioCG } from '../entities/horario-cg.entity';

@Injectable()
export class CompetenciasService {
  constructor(
    @InjectRepository(Competencia)
    private readonly repo: Repository<Competencia>,
    @InjectRepository(HorarioCG)
    private readonly horarioRepo: Repository<HorarioCG>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Competencia>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Competencia>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Competencia no encontrada');
    return this.repo.remove(entity);
  }

  findByHorario(horarioId: string) {
    return this.repo.find({ where: { horarioId } });
  }

  async findByInstructor(instructorId: string) {
    const horarios = await this.horarioRepo.find({
      where: { instructorId },
      select: ['id'],
    });
    if (!horarios.length) return [];
    const horarioIds = horarios.map((h) => h.id);
    return this.repo.find({ where: { horarioId: In(horarioIds) } });
  }
}
