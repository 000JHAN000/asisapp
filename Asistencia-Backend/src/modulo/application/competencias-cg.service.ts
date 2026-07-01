import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import { CompetenciaOrmEntity } from 'src/modulo/infrastructure/entities/competencia.orm-entity';
import { HorarioOrmEntity } from 'src/horario/infrastructure/entities/horario.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class CompetenciasCGService {
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

  private async getCompetenciaRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, CompetenciaOrmEntity);
  }

  private async getHorarioRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, HorarioOrmEntity);
  }

  async findAll() {
    const repo = await this.getCompetenciaRepo();
    return repo.find();
  }

  async findOne(id: string) {
    const repo = await this.getCompetenciaRepo();
    return repo.findOne({ where: { id_competencia: id } });
  }

  private mapDtoToEntity(data: any): Partial<CompetenciaOrmEntity> {
    return {
      id_competencia: data.id,
      nombre: data.nombre,
      resultado: data.resultado,
      horas_requeridas: data.horasRequeridas,
      horario_fk: data.horarioId,
      fecha_inicio: data.fechaInicio,
      fecha_fin: data.fechaFin,
      dias_clase: data.diasClase,
    };
  }

  async create(data: any) {
    const repo = await this.getCompetenciaRepo();
    const entity = repo.create(this.mapDtoToEntity(data));
    return repo.save(entity);
  }

  async update(id: string, data: any) {
    const repo = await this.getCompetenciaRepo();
    await repo.update({ id_competencia: id }, this.mapDtoToEntity(data));
    return this.findOne(id);
  }

  async remove(id: string) {
    const repo = await this.getCompetenciaRepo();
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('CompetenciaOrmEntity no encontrada');
    return repo.remove(entity);
  }

  async findByHorario(horario_fk: string) {
    const repo = await this.getCompetenciaRepo();
    return repo.find({ where: { horario_fk } });
  }

  async findByInstructor(instructorId: string) {
    const [compRepo, horarioRepo] = await Promise.all([
      this.getCompetenciaRepo(),
      this.getHorarioRepo(),
    ]);
    const horarios = await horarioRepo.find({
      where: { instructor_fk: instructorId },
      select: ['id_horario'],
    });
    if (!horarios.length) return [];
    const horario_fks = horarios.map((h) => h.id_horario);
    return compRepo.find({ where: { horario_fk: In(horario_fks) } });
  }
}
