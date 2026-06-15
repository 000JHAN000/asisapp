import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminCG } from '../entities/admin-cg.entity';

@Injectable()
export class AdministradoresService {
  constructor(
    @InjectRepository(AdminCG)
    private readonly repo: Repository<AdminCG>,
  ) {}

  findAll() {
    return this.repo.find();
  }
}
