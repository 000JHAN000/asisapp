import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudCambio } from '../entities/solicitud-cambio.entity';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(SolicitudCambio)
    private readonly repo: Repository<SolicitudCambio>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<SolicitudCambio>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<SolicitudCambio>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Solicitud no encontrada');
    return this.repo.remove(entity);
  }

  findByInstructor(instructorId: string) {
    return this.repo.find({ where: { instructorId } });
  }

  countPendientes() {
    return this.repo.count({ where: { estado: 'pendiente' } });
  }

  async responder(
    id: string,
    estado: 'aprobada' | 'rechazada',
    respuestaAdmin?: string,
  ) {
    const solicitud = await this.findOne(id);
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    solicitud.estado = estado;
    if (respuestaAdmin !== undefined) solicitud.respuestaAdmin = respuestaAdmin;
    return this.repo.save(solicitud);
  }

  async cancelar(id: string) {
    const solicitud = await this.findOne(id);
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    solicitud.estado = 'cancelada';
    return this.repo.save(solicitud);
  }
}
