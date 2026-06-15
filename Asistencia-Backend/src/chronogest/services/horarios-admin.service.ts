import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class HorariosAdminService {
  constructor(
    @InjectRepository(Ficha)
    private readonly fichaRepo: Repository<Ficha>,
    @InjectRepository(InstructorCG)
    private readonly instructorRepo: Repository<InstructorCG>,
    @InjectRepository(AprendizCG)
    private readonly aprendizRepo: Repository<AprendizCG>,
    @InjectRepository(AdminCG)
    private readonly adminRepo: Repository<AdminCG>,
    @InjectRepository(AmbienteCG)
    private readonly ambienteRepo: Repository<AmbienteCG>,
    @InjectRepository(HorarioCG)
    private readonly horarioRepo: Repository<HorarioCG>,
    @InjectRepository(Competencia)
    private readonly competenciaRepo: Repository<Competencia>,
    @InjectRepository(Evento)
    private readonly eventoRepo: Repository<Evento>,
    @InjectRepository(SolicitudCambio)
    private readonly solicitudRepo: Repository<SolicitudCambio>,
    @InjectRepository(Notificacion)
    private readonly notificacionRepo: Repository<Notificacion>,
    @InjectRepository(ConfiguracionApp)
    private readonly configRepo: Repository<ConfiguracionApp>,
  ) {}

  // ─── Administradores ───
  findAllAdmins() {
    return this.adminRepo.find();
  }
  findOneAdmin(id: string) {
    return this.adminRepo.findOneBy({ id });
  }
  createAdmin(data: Partial<AdminCG>) {
    return this.adminRepo.save(data);
  }
  updateAdmin(id: string, data: Partial<AdminCG>) {
    return this.adminRepo.update({ id }, data);
  }
  removeAdmin(id: string) {
    return this.adminRepo.delete({ id });
  }

  // ─── Instructores ───
  findAllInstructores() {
    return this.instructorRepo.find();
  }
  findOneInstructor(id: string) {
    return this.instructorRepo.findOneBy({ id });
  }
  createInstructor(data: Partial<InstructorCG>) {
    return this.instructorRepo.save(data);
  }
  updateInstructor(id: string, data: Partial<InstructorCG>) {
    return this.instructorRepo.update({ id }, data);
  }
  removeInstructor(id: string) {
    return this.instructorRepo.delete({ id });
  }

  // ─── Aprendices ───
  findAllAprendices() {
    return this.aprendizRepo.find();
  }
  findOneAprendiz(id: string) {
    return this.aprendizRepo.findOneBy({ id });
  }
  createAprendiz(data: Partial<AprendizCG>) {
    return this.aprendizRepo.save(data);
  }
  updateAprendiz(id: string, data: Partial<AprendizCG>) {
    return this.aprendizRepo.update({ id }, data);
  }
  removeAprendiz(id: string) {
    return this.aprendizRepo.delete({ id });
  }

  // ─── Fichas ───
  findAllFichas() {
    return this.fichaRepo.find();
  }
  findOneFicha(id: string) {
    return this.fichaRepo.findOneBy({ id });
  }
  createFicha(data: Partial<Ficha>) {
    return this.fichaRepo.save(data);
  }
  updateFicha(id: string, data: Partial<Ficha>) {
    return this.fichaRepo.update({ id }, data);
  }
  removeFicha(id: string) {
    return this.fichaRepo.delete({ id });
  }
  findFichasOpts() {
    return this.fichaRepo.find({ select: ['id', 'codigo'] });
  }

  // ─── Ambientes ───
  findAllAmbientes() {
    return this.ambienteRepo.find();
  }
  findOneAmbiente(id: string) {
    return this.ambienteRepo.findOneBy({ id });
  }
  createAmbiente(data: Partial<AmbienteCG>) {
    return this.ambienteRepo.save(data);
  }
  updateAmbiente(id: string, data: Partial<AmbienteCG>) {
    return this.ambienteRepo.update({ id }, data);
  }
  removeAmbiente(id: string) {
    return this.ambienteRepo.delete({ id });
  }

  // ─── Horarios ───
  findAllHorarios() {
    return this.horarioRepo.find();
  }
  findOneHorario(id: string) {
    return this.horarioRepo.findOneBy({ id });
  }
  createHorario(data: Partial<HorarioCG>) {
    return this.horarioRepo.save(data);
  }
  updateHorario(id: string, data: Partial<HorarioCG>) {
    return this.horarioRepo.update({ id }, data);
  }
  removeHorario(id: string) {
    return this.horarioRepo.delete({ id });
  }

  // ─── Competencias ───
  findAllCompetencias() {
    return this.competenciaRepo.find();
  }
  findOneCompetencia(id: string) {
    return this.competenciaRepo.findOneBy({ id });
  }
  createCompetencia(data: Partial<Competencia>) {
    return this.competenciaRepo.save(data);
  }
  updateCompetencia(id: string, data: Partial<Competencia>) {
    return this.competenciaRepo.update({ id }, data);
  }
  removeCompetencia(id: string) {
    return this.competenciaRepo.delete({ id });
  }

  // ─── Eventos ───
  findAllEventos() {
    return this.eventoRepo.find();
  }
  findOneEvento(id: string) {
    return this.eventoRepo.findOneBy({ id });
  }
  createEvento(data: Partial<Evento>) {
    return this.eventoRepo.save(data);
  }
  updateEvento(id: string, data: Partial<Evento>) {
    return this.eventoRepo.update({ id }, data);
  }
  removeEvento(id: string) {
    return this.eventoRepo.delete({ id });
  }

  // ─── Solicitudes ───
  findAllSolicitudes() {
    return this.solicitudRepo.find();
  }
  findOneSolicitud(id: string) {
    return this.solicitudRepo.findOneBy({ id });
  }
  createSolicitud(data: Partial<SolicitudCambio>) {
    return this.solicitudRepo.save(data);
  }
  updateSolicitud(id: string, data: Partial<SolicitudCambio>) {
    return this.solicitudRepo.update({ id }, data);
  }
  removeSolicitud(id: string) {
    return this.solicitudRepo.delete({ id });
  }

  // ─── Notificaciones ───
  findAllNotificaciones() {
    return this.notificacionRepo.find();
  }
  findOneNotificacion(id: string) {
    return this.notificacionRepo.findOneBy({ id });
  }
  createNotificacion(data: Partial<Notificacion>) {
    return this.notificacionRepo.save(data);
  }
  updateNotificacion(id: string, data: Partial<Notificacion>) {
    return this.notificacionRepo.update({ id }, data);
  }
  removeNotificacion(id: string) {
    return this.notificacionRepo.delete({ id });
  }

  // ─── Configuración ───
  findAllConfiguracion() {
    return this.configRepo.find();
  }
  findOneConfiguracion(id: string) {
    return this.configRepo.findOneBy({ id });
  }
  createConfiguracion(data: Partial<ConfiguracionApp>) {
    return this.configRepo.save(data);
  }
  updateConfiguracion(id: string, data: Partial<ConfiguracionApp>) {
    return this.configRepo.update({ id }, data);
  }
  removeConfiguracion(id: string) {
    return this.configRepo.delete({ id });
  }
}
