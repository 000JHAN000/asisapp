import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Ficha } from '../entities/ficha.entity';
import { InstructorCG } from '../entities/instructor-cg.entity';
import { AprendizCG } from '../entities/aprendiz-cg.entity';
import { AdminCG } from '../entities/admin-cg.entity';
import { AmbienteCG } from '../entities/ambiente-cg.entity';
import { HorarioCG } from '../entities/horario-cg.entity';
import { Competencia } from '../entities/competencia.entity';
import { Evento } from '../entities/evento.entity';
import { SolicitudCambio } from '../entities/solicitud-cambio.entity';
import { Notificacion } from '../entities/notificacion.entity';
import { ConfiguracionApp } from '../entities/configuracion-app.entity';

import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class HorariosAdminService {
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

  private async getRepo(entity: any) {
    return this.connectionManager.getTenantRepository(this.tenantId, entity);
  }

  // ─── Administradores ───
  async findAllAdmins() {
    const repo = await this.getRepo(AdminCG);
    return repo.find();
  }

  async findOneAdmin(id: string) {
    const repo = await this.getRepo(AdminCG);
    return repo.findOneBy({ id });
  }

  async createAdmin(data: Partial<AdminCG>) {
    const repo = await this.getRepo(AdminCG);
    return repo.save(data);
  }

  async updateAdmin(id: string, data: Partial<AdminCG>) {
    const repo = await this.getRepo(AdminCG);
    return repo.update({ id }, data);
  }

  async removeAdmin(id: string) {
    const repo = await this.getRepo(AdminCG);
    return repo.delete({ id });
  }

  // ─── Instructores ───
  async findAllInstructores() {
    const repo = await this.getRepo(InstructorCG);
    return repo.find();
  }

  async findOneInstructor(id: string) {
    const repo = await this.getRepo(InstructorCG);
    return repo.findOneBy({ id });
  }

  async createInstructor(data: Partial<InstructorCG>) {
    const repo = await this.getRepo(InstructorCG);
    return repo.save(data);
  }

  async updateInstructor(id: string, data: Partial<InstructorCG>) {
    const repo = await this.getRepo(InstructorCG);
    return repo.update({ id }, data);
  }

  async removeInstructor(id: string) {
    const repo = await this.getRepo(InstructorCG);
    return repo.delete({ id });
  }

  // ─── Aprendices ───
  async findAllAprendices() {
    const repo = await this.getRepo(AprendizCG);
    return repo.find();
  }

  async findOneAprendiz(id: string) {
    const repo = await this.getRepo(AprendizCG);
    return repo.findOneBy({ id });
  }

  async createAprendiz(data: Partial<AprendizCG>) {
    const repo = await this.getRepo(AprendizCG);
    return repo.save(data);
  }

  async updateAprendiz(id: string, data: Partial<AprendizCG>) {
    const repo = await this.getRepo(AprendizCG);
    return repo.update({ id }, data);
  }

  async removeAprendiz(id: string) {
    const repo = await this.getRepo(AprendizCG);
    return repo.delete({ id });
  }

  // ─── Fichas ───
  async findAllFichas() {
    const repo = await this.getRepo(Ficha);
    return repo.find();
  }

  async findOneFicha(id: string) {
    const repo = await this.getRepo(Ficha);
    return repo.findOneBy({ id });
  }

  async createFicha(data: Partial<Ficha>) {
    const repo = await this.getRepo(Ficha);
    return repo.save(data);
  }

  async updateFicha(id: string, data: Partial<Ficha>) {
    const repo = await this.getRepo(Ficha);
    return repo.update({ id }, data);
  }

  async removeFicha(id: string) {
    const repo = await this.getRepo(Ficha);
    return repo.delete({ id });
  }

  async findFichasOpts() {
    const repo = await this.getRepo(Ficha);
    return repo.find({ select: ['id', 'codigo'] });
  }

  // ─── Ambientes ───
  async findAllAmbientes() {
    const repo = await this.getRepo(AmbienteCG);
    return repo.find();
  }

  async findOneAmbiente(id: string) {
    const repo = await this.getRepo(AmbienteCG);
    return repo.findOneBy({ id });
  }

  async createAmbiente(data: Partial<AmbienteCG>) {
    const repo = await this.getRepo(AmbienteCG);
    return repo.save(data);
  }

  async updateAmbiente(id: string, data: Partial<AmbienteCG>) {
    const repo = await this.getRepo(AmbienteCG);
    return repo.update({ id }, data);
  }

  async removeAmbiente(id: string) {
    const repo = await this.getRepo(AmbienteCG);
    return repo.delete({ id });
  }

  // ─── Horarios ───
  async findAllHorarios() {
    const repo = await this.getRepo(HorarioCG);
    return repo.find();
  }

  async findOneHorario(id: string) {
    const repo = await this.getRepo(HorarioCG);
    return repo.findOneBy({ id });
  }

  async createHorario(data: Partial<HorarioCG>) {
    const repo = await this.getRepo(HorarioCG);
    return repo.save(data);
  }

  async updateHorario(id: string, data: Partial<HorarioCG>) {
    const repo = await this.getRepo(HorarioCG);
    return repo.update({ id }, data);
  }

  async removeHorario(id: string) {
    const repo = await this.getRepo(HorarioCG);
    return repo.delete({ id });
  }

  // ─── Competencias ───
  async findAllCompetencias() {
    const repo = await this.getRepo(Competencia);
    return repo.find();
  }

  async findOneCompetencia(id: string) {
    const repo = await this.getRepo(Competencia);
    return repo.findOneBy({ id });
  }

  async createCompetencia(data: Partial<Competencia>) {
    const repo = await this.getRepo(Competencia);
    return repo.save(data);
  }

  async updateCompetencia(id: string, data: Partial<Competencia>) {
    const repo = await this.getRepo(Competencia);
    return repo.update({ id }, data);
  }

  async removeCompetencia(id: string) {
    const repo = await this.getRepo(Competencia);
    return repo.delete({ id });
  }

  // ─── Eventos ───
  async findAllEventos() {
    const repo = await this.getRepo(Evento);
    return repo.find();
  }

  async findOneEvento(id: string) {
    const repo = await this.getRepo(Evento);
    return repo.findOneBy({ id });
  }

  async createEvento(data: Partial<Evento>) {
    const repo = await this.getRepo(Evento);
    return repo.save(data);
  }

  async updateEvento(id: string, data: Partial<Evento>) {
    const repo = await this.getRepo(Evento);
    return repo.update({ id }, data);
  }

  async removeEvento(id: string) {
    const repo = await this.getRepo(Evento);
    return repo.delete({ id });
  }

  // ─── Solicitudes ───
  async findAllSolicitudes() {
    const repo = await this.getRepo(SolicitudCambio);
    return repo.find();
  }

  async findOneSolicitud(id: string) {
    const repo = await this.getRepo(SolicitudCambio);
    return repo.findOneBy({ id });
  }

  // ─── Notificaciones ───
  async findAllNotificaciones() {
    const repo = await this.getRepo(Notificacion);
    return repo.find();
  }

  async findOneNotificacion(id: string) {
    const repo = await this.getRepo(Notificacion);
    return repo.findOneBy({ id });
  }

  async removeNotificacion(id: string) {
    const repo = await this.getRepo(Notificacion);
    return repo.delete({ id });
  }

  // ─── Configuración ───
  async findAllConfiguracion() {
    const repo = await this.getRepo(ConfiguracionApp);
    return repo.find();
  }

  async findOneConfiguracion(id: string) {
    const repo = await this.getRepo(ConfiguracionApp);
    return repo.findOneBy({ id });
  }

  async createConfiguracion(data: Partial<ConfiguracionApp>) {
    const repo = await this.getRepo(ConfiguracionApp);
    return repo.save(data);
  }

  async updateConfiguracion(id: string, data: Partial<ConfiguracionApp>) {
    const repo = await this.getRepo(ConfiguracionApp);
    return repo.update({ id }, data);
  }

  async removeConfiguracion(id: string) {
    const repo = await this.getRepo(ConfiguracionApp);
    return repo.delete({ id });
  }
}
