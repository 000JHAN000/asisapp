import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ficha } from '../entities/ficha.entity';

@Injectable()
export class FichasService {
  constructor(
    @InjectRepository(Ficha)
    private readonly repo: Repository<Ficha>,
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
}
