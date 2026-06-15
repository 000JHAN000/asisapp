import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HorarioCG } from '../entities/horario-cg.entity';

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(HorarioCG)
    private readonly repo: Repository<HorarioCG>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<HorarioCG>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<HorarioCG>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Horario no encontrado');
    return this.repo.remove(entity);
  }

  findByInstructor(instructorId: string) {
    return this.repo.find({ where: { instructorId } });
  }

  findByFicha(fichaId: string) {
    return this.repo.find({ where: { fichaId } });
  }

  findByAmbiente(ambienteId: string) {
    return this.repo.find({ where: { ambienteId } });
  }

  async toggle(id: string) {
    const horario = await this.findOne(id);
    if (!horario) throw new NotFoundException('Horario no encontrado');
    horario.activo = !horario.activo;
    horario.estado = horario.activo ? 'activo' : 'programado';
    return this.repo.save(horario);
  }

  async play(
    id: string,
    payload?: {
      ambienteId?: string;
      ubicacionTransversalNombre?: string;
    },
  ) {
    const horario = await this.findOne(id);
    if (!horario) throw new NotFoundException('Horario no encontrado');
    horario.activo = true;
    horario.estado = 'activo';
    if (payload?.ambienteId) horario.ambienteId = payload.ambienteId;
    if (payload?.ubicacionTransversalNombre)
      horario.ubicacionTransversalNombre = payload.ubicacionTransversalNombre;
    return this.repo.save(horario);
  }

  async finalizar(id: string, _motivo?: string) {
    const horario = await this.findOne(id);
    if (!horario) throw new NotFoundException('Horario no encontrado');
    horario.activo = false;
    horario.estado = 'finalizado';
    return this.repo.save(horario);
  }

  async finalizarTransversal(id: string) {
    const horario = await this.findOne(id);
    if (!horario) throw new NotFoundException('Horario no encontrado');
    horario.activo = false;
    horario.estado = 'finalizado';
    (horario as any).ubicacionTransversalNombre = null;
    return this.repo.save(horario);
  }

  async getStats() {
    const total = await this.repo.count();
    const activos = await this.repo.count({ where: { activo: true } });
    return { total, activos };
  }
}
