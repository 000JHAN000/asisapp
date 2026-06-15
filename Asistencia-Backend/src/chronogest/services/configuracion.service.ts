import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionApp } from '../entities/configuracion-app.entity';

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(ConfiguracionApp)
    private readonly repo: Repository<ConfiguracionApp>,
  ) {}

  async find() {
    let config = await this.repo.findOne({ where: {} });
    if (!config) {
      config = this.repo.create({ pinRegistro: '1234' });
      config = await this.repo.save(config);
    }
    return config;
  }

  async updatePin(pin: string) {
    const config = await this.find();
    config.pinRegistro = pin;
    return this.repo.save(config);
  }
}
