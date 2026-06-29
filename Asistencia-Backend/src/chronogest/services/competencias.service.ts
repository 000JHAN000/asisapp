import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import { Competencia } from '../entities/competencia.entity';
import { HorarioCG } from '../entities/horario-cg.entity';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class CompetenciasService {
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
    return this.connectionManager.getTenantRepository(this.tenantId, Competencia);
  }

  private async getHorarioRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, HorarioCG);
  }

  async findAll() {
    const repo = await this.getCompetenciaRepo();
    return repo.find();
  }

  async findOne(id: string) {
    const repo = await this.getCompetenciaRepo();
    return repo.findOne({ where: { id } });
  }

  async create(data: Partial<Competencia>) {
    const repo = await this.getCompetenciaRepo();
    const entity = repo.create(data);
    return repo.save(entity);
  }

  async update(id: string, data: Partial<Competencia>) {
    const repo = await this.getCompetenciaRepo();
    await repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const repo = await this.getCompetenciaRepo();
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('Competencia no encontrada');
    return repo.remove(entity);
  }

  async findByHorario(horarioId: string) {
    const repo = await this.getCompetenciaRepo();
    return repo.find({ where: { horarioId } });
  }

  async findByInstructor(instructorId: string) {
    const [compRepo, horarioRepo] = await Promise.all([
      this.getCompetenciaRepo(),
      this.getHorarioRepo(),
    ]);
    const horarios = await horarioRepo.find({
      where: { instructorId },
      select: ['id'],
    });
    if (!horarios.length) return [];
    const horarioIds = horarios.map((h) => h.id);
    return compRepo.find({ where: { horarioId: In(horarioIds) } });
  }
}
