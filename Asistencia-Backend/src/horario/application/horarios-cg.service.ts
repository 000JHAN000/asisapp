import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { HorarioOrmEntity } from 'src/horario/infrastructure/entities/horario.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class HorariosCGService {
  constructor(
    private readonly connectionManager: TenantConnectionManager,
  ) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new BadRequestException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private async getRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, HorarioOrmEntity);
  }

  private mapToDto(h: HorarioOrmEntity) {
    return {
      id: h.id_horario,
      diaSemana: h.diaSemana,
      jornada: h.jornada,
      horaInicio: h.hora_inicio,
      horaFin: h.hora_fin,
      fichaId: h.curso_fk,
      instructorId: h.instructor_fk,
      ambienteId: h.ambiente_fk,
      activo: h.activo,
      estado: h.estado,
      minutosRetraso: h.minutos_retraso,
      ubicacionTransversalNombre: h.ubicacion_transversal_nombre,
    };
  }

  private mapDtoToEntity(data: any): Partial<HorarioOrmEntity> {
    return {
      id_horario: data.id,
      diaSemana: data.diaSemana,
      jornada: data.jornada,
      hora_inicio: data.horaInicio,
      hora_fin: data.horaFin,
      curso_fk: data.fichaId,
      instructor_fk: data.instructorId,
      ambiente_fk: data.ambienteId,
      activo: data.activo,
      estado: data.estado,
      minutos_retraso: data.minutosRetraso,
      ubicacion_transversal_nombre: data.ubicacionTransversalNombre,
    };
  }

  async findAll() {
    const repo = await this.getRepo();
    const items = await repo.find();
    return items.map((h) => this.mapToDto(h));
  }

  async findOne(id: string) {
    const repo = await this.getRepo();
    const item = await repo.findOne({ where: { id_horario: id } });
    return item ? this.mapToDto(item) : null;
  }

  private async createOne(data: any) {
    const repo = await this.getRepo();
    const entity = repo.create(this.mapDtoToEntity(data));
    const saved = await repo.save(entity);
    return this.mapToDto(saved);
  }

  async create(data: any) {
    if (Array.isArray(data)) {
      const results: any[] = [];
      for (const item of data) {
        results.push(await this.createOne(item));
      }
      return results;
    }
    return this.createOne(data);
  }

  async update(id: string, data: any) {
    const repo = await this.getRepo();
    await repo.update({ id_horario: id }, this.mapDtoToEntity(data));
    return this.findOne(id);
  }

  async remove(id: string) {
    const repo = await this.getRepo();
    const entity = await repo.findOne({ where: { id_horario: id } });
    if (!entity) throw new NotFoundException('Horario no encontrado');
    return repo.remove(entity);
  }

  async findByInstructor(instructorId: string) {
    const repo = await this.getRepo();
    const items = await repo.find({ where: { instructor_fk: instructorId } });
    return items.map((h) => this.mapToDto(h));
  }

  async findByFicha(fichaId: string) {
    const repo = await this.getRepo();
    const items = await repo.find({ where: { curso_fk: fichaId } });
    return items.map((h) => this.mapToDto(h));
  }

  async findByAmbiente(ambienteId: string) {
    const repo = await this.getRepo();
    const items = await repo.find({ where: { ambiente_fk: ambienteId } });
    return items.map((h) => this.mapToDto(h));
  }

  async toggle(id: string) {
    const repo = await this.getRepo();
    const horario = await repo.findOne({ where: { id_horario: id } });
    if (!horario) throw new NotFoundException('Horario no encontrado');
    horario.activo = !horario.activo;
    horario.estado = horario.activo ? 'activo' : 'programado';
    const saved = await repo.save(horario);
    return this.mapToDto(saved);
  }

  /** Sólo se puede iniciar el día correspondiente. */
  private estaDentroDelHorario(horario: HorarioOrmEntity): boolean {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const now = new Date();
    if (horario.diaSemana && horario.diaSemana !== dias[now.getDay()]) return false;

    return true;
  }

  async play(
    id: string,
    payload?: {
      ambienteId?: string;
      ubicacionTransversalNombre?: string;
    },
  ) {
    const repo = await this.getRepo();
    const horario = await repo.findOne({ where: { id_horario: id } });
    if (!horario) throw new NotFoundException('Horario no encontrado');
    if (!this.estaDentroDelHorario(horario)) {
      throw new BadRequestException('Solo puedes iniciar la clase el día y dentro del horario programado.');
    }
    horario.activo = true;
    horario.estado = 'activo';
    if (payload?.ambienteId) horario.ambiente_fk = payload.ambienteId;
    if (payload?.ubicacionTransversalNombre)
      horario.ubicacion_transversal_nombre = payload.ubicacionTransversalNombre;
    const saved = await repo.save(horario);
    return this.mapToDto(saved);
  }

  async finalizar(id: string, _motivo?: string) {
    const repo = await this.getRepo();
    const horario = await repo.findOne({ where: { id_horario: id } });
    if (!horario) throw new NotFoundException('Horario no encontrado');
    horario.activo = false;
    horario.estado = 'finalizado';
    const saved = await repo.save(horario);
    return this.mapToDto(saved);
  }

  async finalizarTransversal(id: string) {
    const repo = await this.getRepo();
    const horario = await repo.findOne({ where: { id_horario: id } });
    if (!horario) throw new NotFoundException('Horario no encontrado');
    horario.activo = false;
    horario.estado = 'finalizado';
    horario.ubicacion_transversal_nombre = null;
    const saved = await repo.save(horario);
    return this.mapToDto(saved);
  }

  async getStats() {
    const repo = await this.getRepo();
    const total = await repo.count();
    const activos = await repo.count({ where: { activo: true } });
    return { total, activos };
  }
}
