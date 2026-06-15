import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ubicacion } from '../entities/ubicacion.entity';

@Injectable()
export class UbicacionesService {
  constructor(
    @InjectRepository(Ubicacion)
    private readonly repo: Repository<Ubicacion>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Ubicacion>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Ubicacion>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Ubicación no encontrada');
    return this.repo.remove(entity);
  }

  async findTipos() {
    const result = await this.repo
      .createQueryBuilder('ubicacion')
      .select('DISTINCT ubicacion.tipo', 'tipo')
      .getRawMany();
    return result.map((r) => r.tipo);
  }

  findByTipo(tipo: string) {
    return this.repo.find({ where: { tipo } });
  }

  async findDisponiblesTransversal(
    tipo?: string,
    _dia?: string,
    _jornada?: string,
  ) {
    // Mock: devolver todas las ubicaciones filtradas por tipo si se proporciona
    if (tipo) {
      return this.repo.find({ where: { tipo } });
    }
    return this.repo.find();
  }
}
