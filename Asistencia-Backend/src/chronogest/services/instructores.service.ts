import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstructorCG } from '../entities/instructor-cg.entity';

@Injectable()
export class InstructoresService {
  constructor(
    @InjectRepository(InstructorCG)
    private readonly repo: Repository<InstructorCG>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async update(id: string, data: any) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async setLider(id: string, esLider: boolean, areaLiderada?: string) {
    await this.repo.update(id, {
      esLider,
      areaLiderada: esLider ? areaLiderada : undefined,
    });
    return this.repo.findOne({ where: { id } });
  }

  async setTransversal(id: string, esTransversal: boolean) {
    await this.repo.update(id, { esTransversal });
    return this.repo.findOne({ where: { id } });
  }

  async getStats() {
    const total = await this.repo.count();
    const lideres = await this.repo.count({ where: { esLider: true } });
    const transversales = await this.repo.count({ where: { esTransversal: true } });
    return { total, lideres, transversales };
  }
}
