import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';

import { AdministradorOrmEntity } from 'src/persona/infrastructure/entities/administrador.orm-entity';
import { CompetenciaOrmEntity } from 'src/modulo/infrastructure/entities/competencia.orm-entity';
import { EventoOrmEntity } from 'src/aplicativo/infrastructure/entities/evento.orm-entity';
import { SolicitudCambioOrmEntity } from 'src/aplicativo/infrastructure/entities/solicitud-cambio.orm-entity';
import { NotificacionOrmEntity } from 'src/aplicativo/infrastructure/entities/notificacion.orm-entity';
import { ConfiguracionAppOrmEntity } from 'src/aplicativo/infrastructure/entities/configuracion-app.orm-entity';

// Entidades legacy conectadas
import { InstructorOrmEntity } from 'src/persona/infrastructure/entities/instructor.orm-entity';
import { PersonaOrmEntity } from 'src/persona/infrastructure/entities/persona.orm-entity';
import { MatriculaOrmEntity } from 'src/matricula/infrastructure/entities/matricula.orm-entity';
import { CursoOrmEntity } from 'src/curso/infrastructure/entities/curso.orm-entity';
import { AmbienteOrmEntity } from 'src/ambiente/infrastructure/entities/ambiente.orm-entity';
import { HorarioOrmEntity } from 'src/horario/infrastructure/entities/horario.orm-entity';
import { ProgramaOrmEntity } from 'src/programa/infrastructure/entities/programa.orm-entity';
import { AreaOrmEntity } from 'src/area/infrastructure/entities/area.orm-entity';

import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

interface AmbienteCGData {
  nombre?: string;
  capacidad?: number | null;
  tipo?: string | null;
  area?: string;
}

@Injectable()
export class HorariosAdminCGService {
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

  private async getRepo<T extends ObjectLiteral>(entity: EntityTarget<T>): Promise<Repository<T>> {
    return this.connectionManager.getTenantRepository(this.tenantId, entity);
  }

  // ─── Administradores (legacy conectado) ───
  private mapAdmin(a: AdministradorOrmEntity) {
    return {
      id: a.id_administrador,
      nombre: a.persona?.nombres ?? '',
      apellido: a.persona?.apellidos ?? null,
      correo: a.persona?.correo ?? '',
      documento: a.persona?.documento ?? '',
      personaId: a.persona_fk,
    };
  }

  async findAllAdmins() {
    const repo = await this.getRepo(AdministradorOrmEntity);
    const items = await repo.find({ relations: ['persona'] });
    return items.map((a) => this.mapAdmin(a));
  }

  async findOneAdmin(id: string) {
    const repo = await this.getRepo(AdministradorOrmEntity);
    const item = await repo.findOne({ where: { id_administrador: id }, relations: ['persona'] });
    return item ? this.mapAdmin(item) : null;
  }

  async createAdmin(data: any) {
    const personaRepo = await this.getRepo(PersonaOrmEntity);
    const adminRepo = await this.getRepo(AdministradorOrmEntity);

    const persona = await personaRepo.save({
      documento: data.documento ?? '',
      nombres: data.nombre ?? '',
      apellidos: data.apellido ?? null,
      correo: data.correo ?? '',
      estado: 'activo' as any,
    });

    const item = await adminRepo.save({ persona_fk: persona.id_persona });
    return this.mapAdmin({ ...item, persona });
  }

  async updateAdmin(id: string, data: any) {
    const adminRepo = await this.getRepo(AdministradorOrmEntity);
    const personaRepo = await this.getRepo(PersonaOrmEntity);

    const admin = await adminRepo.findOne({ where: { id_administrador: id }, relations: ['persona'] });
    if (!admin) throw new BadRequestException('Administrador no encontrado');

    if (data.nombre || data.apellido || data.correo || data.documento) {
      await personaRepo.update({ id_persona: admin.persona_fk }, {
        nombres: data.nombre ?? admin.persona.nombres,
        apellidos: data.apellido ?? admin.persona.apellidos,
        correo: data.correo ?? admin.persona.correo,
        documento: data.documento ?? admin.persona.documento,
      });
    }

    return this.findOneAdmin(id);
  }

  async removeAdmin(id: string) {
    const adminRepo = await this.getRepo(AdministradorOrmEntity);
    return adminRepo.delete({ id_administrador: id });
  }

  // ─── Instructores (legacy conectado) ───
  private mapInstructor(i: InstructorOrmEntity) {
    return {
      id: i.id_instructor,
      nombre: i.persona?.nombres ?? '',
      apellido: i.persona?.apellidos ?? null,
      correo: i.persona?.correo ?? '',
      documento: i.persona?.documento ?? '',
      esLider: i.esLider,
      areaLiderada: i.areaLiderada,
      esTransversal: i.esTransversal,
      personaId: i.persona_fk,
    };
  }

  async findAllInstructores() {
    const repo = await this.getRepo(InstructorOrmEntity);
    const items = await repo.find({ relations: ['persona'] });
    return items.map((i) => this.mapInstructor(i));
  }

  async findOneInstructor(id: string) {
    const repo = await this.getRepo(InstructorOrmEntity);
    const item = await repo.findOne({ where: { id_instructor: id }, relations: ['persona'] });
    return item ? this.mapInstructor(item) : null;
  }

  async createInstructor(data: any) {
    const personaRepo = await this.getRepo(PersonaOrmEntity);
    const instructorRepo = await this.getRepo(InstructorOrmEntity);

    const persona = await personaRepo.save({
      documento: data.documento ?? '',
      nombres: data.nombre ?? '',
      apellidos: data.apellido ?? null,
      correo: data.correo ?? '',
      estado: 'activo' as any,
    });

    const item = await instructorRepo.save({
      persona_fk: persona.id_persona,
      esLider: data.esLider ?? false,
      areaLiderada: data.areaLiderada ?? null,
      esTransversal: data.esTransversal ?? false,
    });

    return this.mapInstructor({ ...item, persona });
  }

  async updateInstructor(id: string, data: any) {
    const instructorRepo = await this.getRepo(InstructorOrmEntity);
    const personaRepo = await this.getRepo(PersonaOrmEntity);

    const instructor = await instructorRepo.findOne({ where: { id_instructor: id }, relations: ['persona'] });
    if (!instructor) throw new BadRequestException('Instructor no encontrado');

    await instructorRepo.update({ id_instructor: id }, {
      esLider: data.esLider ?? instructor.esLider,
      areaLiderada: data.areaLiderada ?? instructor.areaLiderada,
      esTransversal: data.esTransversal ?? instructor.esTransversal,
    });

    if (data.nombre || data.apellido || data.correo || data.documento) {
      await personaRepo.update({ id_persona: instructor.persona_fk }, {
        nombres: data.nombre ?? instructor.persona.nombres,
        apellidos: data.apellido ?? instructor.persona.apellidos,
        correo: data.correo ?? instructor.persona.correo,
        documento: data.documento ?? instructor.persona.documento,
      });
    }

    return this.findOneInstructor(id);
  }

  async removeInstructor(id: string) {
    const instructorRepo = await this.getRepo(InstructorOrmEntity);
    return instructorRepo.delete({ id_instructor: id });
  }

  // ─── Aprendices (legacy conectado: persona + matrícula) ───
  private mapAprendiz(p: PersonaOrmEntity) {
    const matricula = p.matriculas?.[0];
    return {
      id: p.id_persona,
      nombre: p.nombres,
      apellido: p.apellidos,
      correo: p.correo,
      documento: p.documento,
      fichaId: matricula?.curso_fk ?? null,
      facePhotoPath: p.facePhotoPath,
      faceEmbedding: p.faceEmbedding,
      lastAttendancePhotoPath: p.lastAttendancePhotoPath,
    };
  }

  async findAllAprendices() {
    const repo = await this.getRepo(PersonaOrmEntity);
    const items = await repo.find({ relations: ['matriculas'] });
    return items.filter((p) => p.matriculas?.length).map((p) => this.mapAprendiz(p));
  }

  async findOneAprendiz(id: string) {
    const repo = await this.getRepo(PersonaOrmEntity);
    const item = await repo.findOne({ where: { id_persona: id }, relations: ['matriculas'] });
    return item ? this.mapAprendiz(item) : null;
  }

  async createAprendiz(data: any) {
    const personaRepo = await this.getRepo(PersonaOrmEntity);
    const matriculaRepo = await this.getRepo(MatriculaOrmEntity);
    const cursoRepo = await this.getRepo(CursoOrmEntity);

    const persona = await personaRepo.save({
      documento: data.documento ?? '',
      nombres: data.nombre ?? '',
      apellidos: data.apellido ?? null,
      correo: data.correo ?? '',
      estado: 'activo' as any,
      facePhotoPath: data.facePhotoPath ?? null,
      faceEmbedding: data.faceEmbedding ?? null,
      lastAttendancePhotoPath: data.lastAttendancePhotoPath ?? null,
    });

    if (data.fichaId) {
      const curso = await cursoRepo.findOneBy({ id_curso: data.fichaId });
      if (curso) {
        await matriculaRepo.save({ persona_fk: persona.id_persona, curso_fk: curso.id_curso });
      }
    }

    const saved = await personaRepo.findOne({ where: { id_persona: persona.id_persona }, relations: ['matriculas'] });
    return this.mapAprendiz(saved!);
  }

  async updateAprendiz(id: string, data: any) {
    const personaRepo = await this.getRepo(PersonaOrmEntity);
    const matriculaRepo = await this.getRepo(MatriculaOrmEntity);

    const persona = await personaRepo.findOne({ where: { id_persona: id }, relations: ['matriculas'] });
    if (!persona) throw new BadRequestException('Aprendiz no encontrado');

    await personaRepo.update({ id_persona: id }, {
      documento: data.documento ?? persona.documento,
      nombres: data.nombre ?? persona.nombres,
      apellidos: data.apellido ?? persona.apellidos,
      correo: data.correo ?? persona.correo,
      facePhotoPath: data.facePhotoPath ?? persona.facePhotoPath,
      faceEmbedding: data.faceEmbedding ?? persona.faceEmbedding,
      lastAttendancePhotoPath: data.lastAttendancePhotoPath ?? persona.lastAttendancePhotoPath,
    });

    if (data.fichaId && persona.matriculas?.[0]?.curso_fk !== data.fichaId) {
      if (persona.matriculas?.[0]) {
        await matriculaRepo.update({ id_matricula: persona.matriculas[0].id_matricula }, { curso_fk: data.fichaId });
      } else {
        await matriculaRepo.save({ persona_fk: id, curso_fk: data.fichaId });
      }
    }

    return this.findOneAprendiz(id);
  }

  async removeAprendiz(id: string) {
    const personaRepo = await this.getRepo(PersonaOrmEntity);
    const matriculaRepo = await this.getRepo(MatriculaOrmEntity);

    const persona = await personaRepo.findOne({ where: { id_persona: id }, relations: ['matriculas'] });
    if (persona?.matriculas?.length) {
      await matriculaRepo.remove(persona.matriculas);
    }
    return personaRepo.delete({ id_persona: id });
  }

  // ─── Fichas (legacy conectado: curso) ───
  private mapFicha(c: CursoOrmEntity) {
    return {
      id: c.id_curso,
      codigo: c.codigo,
      programa: c.programa?.nombre ?? '',
      area: c.area?.nombre ?? '',
      fechaInicio: c.fecha_inicio,
      fechaFin: c.fecha_fin,
      intensidadHoraria: c.intensidad_horaria,
      lider: c.lider ?? '',
    };
  }

  async findAllFichas() {
    const repo = await this.getRepo(CursoOrmEntity);
    const items = await repo.find({ relations: ['programa', 'area'] });
    return items.map((c) => this.mapFicha(c));
  }

  async findOneFicha(id: string) {
    const repo = await this.getRepo(CursoOrmEntity);
    const item = await repo.findOne({ where: { id_curso: id }, relations: ['programa', 'area'] });
    return item ? this.mapFicha(item) : null;
  }

  private async resolveProgramaFk(programaNombre?: string): Promise<string> {
    const programaRepo = await this.getRepo(ProgramaOrmEntity);
    if (programaNombre) {
      const programa = await programaRepo.findOne({ where: { nombre: programaNombre } });
      if (programa) return programa.id_programa;
    }
    const first = await programaRepo.findOne({ where: {}, order: { id_programa: 'ASC' } });
    if (first) return first.id_programa;
    throw new BadRequestException(
      programaNombre
        ? `No existe un programa llamado "${programaNombre}". Crea el programa primero.`
        : 'No hay ningún programa registrado en esta sede. Crea un programa primero.',
    );
  }

  private normalizeLider(lider?: any): string {
    if (!lider) return '';
    if (typeof lider === 'string') return lider.trim();
    if (lider.nombre || lider.apellido) {
      return `${lider.nombre ?? ''} ${lider.apellido ?? ''}`.trim();
    }
    return String(lider);
  }

  async createFicha(data: any) {
    const repo = await this.getRepo(CursoOrmEntity);
    const area_fk = await this.resolveAreaFk(data.area);
    const programa_fk = await this.resolveProgramaFk(data.programa);
    const item = await repo.save({
      codigo: data.codigo ?? '',
      fecha_inicio: data.fechaInicio ?? new Date(),
      fecha_fin: data.fechaFin ?? new Date(),
      fin_lectiva: data.fechaFin ?? new Date(),
      area_fk,
      programa_fk,
      lider: this.normalizeLider(data.lider),
      intensidad_horaria: data.intensidadHoraria ?? null,
    });
    return this.findOneFicha(item.id_curso);
  }

  async updateFicha(id: string, data: any) {
    const repo = await this.getRepo(CursoOrmEntity);
    const update: any = {
      codigo: data.codigo,
      fecha_inicio: data.fechaInicio,
      fecha_fin: data.fechaFin,
      fin_lectiva: data.fechaFin,
      intensidad_horaria: data.intensidadHoraria,
    };
    if (data.area !== undefined) update.area_fk = await this.resolveAreaFk(data.area);
    if (data.programa !== undefined) update.programa_fk = await this.resolveProgramaFk(data.programa);
    if (data.lider !== undefined) update.lider = this.normalizeLider(data.lider);
    await repo.update({ id_curso: id }, update);
    return this.findOneFicha(id);
  }

  async removeFicha(id: string) {
    const repo = await this.getRepo(CursoOrmEntity);
    return repo.delete({ id_curso: id });
  }

  async findFichasOpts() {
    const repo = await this.getRepo(CursoOrmEntity);
    const items = await repo.find({ select: ['id_curso', 'codigo'] });
    return items.map((c) => ({ id: c.id_curso, codigo: c.codigo }));
  }

  // ─── Ambientes (legacy conectado) ───
  private mapAmbiente(a: AmbienteOrmEntity) {
    return {
      id: a.id_ambiente,
      nombre: a.nombre,
      capacidad: a.capacidad,
      tipo: a.tipo,
      area: a.area?.nombre ?? '',
    };
  }

  async findAllAmbientes() {
    const repo = await this.getRepo(AmbienteOrmEntity);
    const items = await repo.find({ relations: ['area'] });
    return items.map((a) => this.mapAmbiente(a));
  }

  async findOneAmbiente(id: string) {
    const repo = await this.getRepo(AmbienteOrmEntity);
    const item = await repo.findOne({ where: { id_ambiente: id }, relations: ['area'] });
    return item ? this.mapAmbiente(item) : null;
  }

  private async resolveAreaFk(areaNombre?: string): Promise<string> {
    const areaRepo = await this.getRepo(AreaOrmEntity);
    if (areaNombre) {
      const area = await areaRepo.findOne({ where: { nombre: areaNombre } });
      if (area) return area.id_area;
    }
    const first = await areaRepo.findOne({ where: {}, order: { id_area: 'ASC' } });
    if (first) return first.id_area;
    throw new BadRequestException(
      areaNombre
        ? `No existe un área llamada "${areaNombre}". Crea el área primero.`
        : 'No hay ninguna área registrada en esta sede. Crea un área primero.',
    );
  }

  async createAmbiente(data: AmbienteCGData) {
    const repo = await this.getRepo(AmbienteOrmEntity);
    const area_fk = await this.resolveAreaFk(data.area);
    const item = await repo.save({
      nombre: data.nombre ?? '',
      capacidad: data.capacidad ?? null,
      tipo: data.tipo ?? null,
      area_fk,
    });
    return this.findOneAmbiente(item.id_ambiente);
  }

  async updateAmbiente(id: string, data: AmbienteCGData) {
    const repo = await this.getRepo(AmbienteOrmEntity);
    const update: any = {
      nombre: data.nombre,
      capacidad: data.capacidad,
      tipo: data.tipo,
    };
    if (data.area !== undefined) {
      update.area_fk = await this.resolveAreaFk(data.area);
    }
    await repo.update({ id_ambiente: id }, update);
    return this.findOneAmbiente(id);
  }

  async removeAmbiente(id: string) {
    const repo = await this.getRepo(AmbienteOrmEntity);
    return repo.delete({ id_ambiente: id });
  }

  // ─── Horarios (legacy conectado) ───
  private mapHorario(h: HorarioOrmEntity, competencias: CompetenciaOrmEntity[] = []) {
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
      ficha: h.curso ? { id: h.curso.id_curso, codigo: h.curso.codigo, programa: h.curso.programa?.nombre ?? '' } : null,
      instructor: h.instructor
        ? {
            id: h.instructor.id_instructor,
            nombre: h.instructor.persona?.nombres ?? '',
            apellido: h.instructor.persona?.apellidos ?? null,
            esTransversal: h.instructor.esTransversal,
          }
        : null,
      ambiente: h.ambiente ? { id: h.ambiente.id_ambiente, nombre: h.ambiente.nombre } : null,
      competencias: competencias.map((c) => ({
        id: c.id_competencia,
        nombre: c.nombre,
        resultado: c.resultado,
        horasRequeridas: c.horas_requeridas,
        horarioId: c.horario_fk,
        fechaInicio: c.fecha_inicio,
        fechaFin: c.fecha_fin,
        diasClase: c.dias_clase,
      })),
    };
  }

  async findAllHorarios() {
    const horarioRepo = await this.getRepo(HorarioOrmEntity);
    const competenciaRepo = await this.getRepo(CompetenciaOrmEntity);

    const horarios = await horarioRepo.find({
      relations: ['curso', 'curso.programa', 'instructor', 'instructor.persona', 'ambiente'],
    });

    const competencias = await competenciaRepo.find();
    const compsByHorario = new Map<string, CompetenciaOrmEntity[]>();
    for (const c of competencias) {
      const list = compsByHorario.get(c.horario_fk) ?? [];
      list.push(c);
      compsByHorario.set(c.horario_fk, list);
    }

    return horarios.map((h) => this.mapHorario(h, compsByHorario.get(h.id_horario) ?? []));
  }

  async findOneHorario(id: string) {
    const horarioRepo = await this.getRepo(HorarioOrmEntity);
    const competenciaRepo = await this.getRepo(CompetenciaOrmEntity);
    const h = await horarioRepo.findOne({
      where: { id_horario: id },
      relations: ['curso', 'curso.programa', 'instructor', 'instructor.persona', 'ambiente'],
    });
    if (!h) return null;
    const competencias = await competenciaRepo.find({ where: { horario_fk: id } });
    return this.mapHorario(h, competencias);
  }

  async createHorario(data: any) {
    const repo = await this.getRepo(HorarioOrmEntity);
    const item = await repo.save({
      diaSemana: data.diaSemana as any,
      jornada: data.jornada as any,
      hora_inicio: data.horaInicio ?? '',
      hora_fin: data.horaFin ?? '',
      curso_fk: data.fichaId ?? '00000000-0000-0000-0000-000000000000',
      instructor_fk: data.instructorId ?? null,
      ambiente_fk: data.ambienteId ?? '00000000-0000-0000-0000-000000000000',
      activo: data.activo ?? true,
      estado: data.estado ?? 'programado',
      minutos_retraso: data.minutosRetraso ?? 0,
      ubicacion_transversal_nombre: data.ubicacionTransversalNombre ?? null,
    });
    return this.findOneHorario(item.id_horario);
  }

  async updateHorario(id: string, data: any) {
    const repo = await this.getRepo(HorarioOrmEntity);
    await repo.update(
      { id_horario: id },
      {
        diaSemana: data.diaSemana as any,
        jornada: data.jornada as any,
        hora_inicio: data.horaInicio,
        hora_fin: data.horaFin,
        curso_fk: data.fichaId,
        instructor_fk: data.instructorId,
        ambiente_fk: data.ambienteId,
        activo: data.activo,
        estado: data.estado as any,
        minutos_retraso: data.minutosRetraso,
        ubicacion_transversal_nombre: data.ubicacionTransversalNombre,
      },
    );
    return this.findOneHorario(id);
  }

  async removeHorario(id: string) {
    const repo = await this.getRepo(HorarioOrmEntity);
    return repo.delete({ id_horario: id });
  }

  // ─── Competencias ───
  async findAllCompetencias() {
    const repo = await this.getRepo(CompetenciaOrmEntity);
    return repo.find();
  }

  async findOneCompetencia(id: string) {
    const repo = await this.getRepo(CompetenciaOrmEntity);
    return repo.findOneBy({ id_competencia: id });
  }

  private mapCompetenciaDtoToEntity(data: any): Partial<CompetenciaOrmEntity> {
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

  async createCompetencia(data: any) {
    const repo = await this.getRepo(CompetenciaOrmEntity);
    return repo.save(this.mapCompetenciaDtoToEntity(data));
  }

  async updateCompetencia(id: string, data: any) {
    const repo = await this.getRepo(CompetenciaOrmEntity);
    return repo.update({ id_competencia: id }, this.mapCompetenciaDtoToEntity(data));
  }

  async removeCompetencia(id: string) {
    const repo = await this.getRepo(CompetenciaOrmEntity);
    return repo.delete({ id_competencia: id });
  }

  // ─── Eventos ───
  async findAllEventos() {
    const repo = await this.getRepo(EventoOrmEntity);
    return repo.find();
  }

  async findOneEvento(id: string) {
    const repo = await this.getRepo(EventoOrmEntity);
    return repo.findOneBy({ id_evento: id });
  }

  private mapEventoDtoToEntity(data: any): Partial<EventoOrmEntity> {
    return {
      id_evento: data.id,
      nombre: data.nombre,
      tipo: data.tipo,
      fecha_inicio: data.fechaInicio,
      fecha_fin: data.fechaFin,
      hora_inicio: data.horaInicio,
      hora_fin: data.horaFin,
      lugar: data.lugar,
      descripcion: data.descripcion,
      fichas: data.fichas,
    };
  }

  async createEvento(data: any) {
    const repo = await this.getRepo(EventoOrmEntity);
    return repo.save(this.mapEventoDtoToEntity(data));
  }

  async updateEvento(id: string, data: any) {
    const repo = await this.getRepo(EventoOrmEntity);
    return repo.update({ id_evento: id }, this.mapEventoDtoToEntity(data));
  }

  async removeEvento(id: string) {
    const repo = await this.getRepo(EventoOrmEntity);
    return repo.delete({ id_evento: id });
  }

  // ─── Solicitudes ───
  async findAllSolicitudes() {
    const repo = await this.getRepo(SolicitudCambioOrmEntity);
    return repo.find();
  }

  async findOneSolicitud(id: string) {
    const repo = await this.getRepo(SolicitudCambioOrmEntity);
    return repo.findOneBy({ id_solicitud: id });
  }

  // ─── Notificaciones ───
  async findAllNotificaciones() {
    const repo = await this.getRepo(NotificacionOrmEntity);
    return repo.find();
  }

  async findOneNotificacion(id: string) {
    const repo = await this.getRepo(NotificacionOrmEntity);
    return repo.findOneBy({ id_notificacion: id });
  }

  async removeNotificacion(id: string) {
    const repo = await this.getRepo(NotificacionOrmEntity);
    return repo.delete({ id_notificacion: id });
  }

  // ─── Configuración ───
  async findAllConfiguracion() {
    const repo = await this.getRepo(ConfiguracionAppOrmEntity);
    return repo.find();
  }

  async findOneConfiguracion(id: string) {
    const repo = await this.getRepo(ConfiguracionAppOrmEntity);
    return repo.findOneBy({ id_configuracion_app: id });
  }

  async createConfiguracion(data: Partial<ConfiguracionAppOrmEntity>) {
    const repo = await this.getRepo(ConfiguracionAppOrmEntity);
    return repo.save(data);
  }

  async updateConfiguracion(id: string, data: any) {
    const repo = await this.getRepo(ConfiguracionAppOrmEntity);
    return repo.update(
      { id_configuracion_app: id },
      { pin_registro: data.pin_registro ?? data.pinRegistro },
    );
  }

  async removeConfiguracion(id: string) {
    const repo = await this.getRepo(ConfiguracionAppOrmEntity);
    return repo.delete({ id_configuracion_app: id });
  }
}
