import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from '../entities/notificacion.entity';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly repo: Repository<Notificacion>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Notificacion>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Notificacion>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Notificación no encontrada');
    return this.repo.remove(entity);
  }

  findByDestinatario(destinatarioId?: string, destinatarioRol?: string) {
    const where: any[] = [];
    if (destinatarioId) where.push({ destinatarioId });
    if (destinatarioRol) where.push({ destinatarioRol });
    if (where.length === 0) return this.repo.find();
    return this.repo.find({ where: where });
  }

  async marcarLeida(id: string) {
    const notif = await this.findOne(id);
    if (!notif) throw new NotFoundException('Notificación no encontrada');
    notif.leida = true;
    return this.repo.save(notif);
  }

  async marcarTodasLeidas(destinatarioRol: string) {
    await this.repo.update({ destinatarioRol }, { leida: true });
    return { affected: true };
  }
}
