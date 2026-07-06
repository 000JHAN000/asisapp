import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { In } from 'typeorm';
import { HorarioOrmEntity } from '../../horario/infrastructure/entities/horario.orm-entity';
import { PersonaOrmEntity } from '../../persona/infrastructure/entities/persona.orm-entity';
import { MatriculaOrmEntity } from '../../matricula/infrastructure/entities/matricula.orm-entity';
import { CursoOrmEntity } from '../../curso/infrastructure/entities/curso.orm-entity';
import { AmbienteOrmEntity } from '../../ambiente/infrastructure/entities/ambiente.orm-entity';
import { InstructorOrmEntity } from '../../persona/infrastructure/entities/instructor.orm-entity';
import { CreateAsistenciaSesionDto } from '../infrastructure/http/dto/create-asistencia-sesion.dto';
import { readFileToBase64Async } from '../../infrastructure/utils/file-storage.util';
import { getColombiaDate, getColombiaDateString } from '../../infrastructure/utils/date.util';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';
import { ASISTENCIA_SESION_REPOSITORY } from '../domain/ports/asistencia-sesion.repository.port';
import type { AsistenciaSesionRepositoryPort } from '../domain/ports/asistencia-sesion.repository.port';
import { ASISTENCIA_REGISTRO_REPOSITORY } from '../domain/ports/asistencia-registro.repository.port';
import type { AsistenciaRegistroRepositoryPort } from '../domain/ports/asistencia-registro.repository.port';
import type { AsistenciaRegistro } from '../domain/entities/asistencia-registro.entity';

@Injectable()
export class AsistenciaSesionService {
  constructor(
    private readonly connectionManager: TenantConnectionManager,
    @Inject(ASISTENCIA_SESION_REPOSITORY)
    private readonly sesionRepo: AsistenciaSesionRepositoryPort,
    @Inject(ASISTENCIA_REGISTRO_REPOSITORY)
    private readonly registroRepo: AsistenciaRegistroRepositoryPort,
  ) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new BadRequestException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private async getHorarioRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, HorarioOrmEntity);
  }

  private async getPersonaRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, PersonaOrmEntity);
  }

  async create(dto: CreateAsistenciaSesionDto, instructorId: string) {
    const horarioRepo = await this.getHorarioRepo();
    const horario = await horarioRepo.findOne({ where: { id_horario: dto.horarioId } });
    if (!horario) throw new BadRequestException('Horario no encontrado');

    const dias = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
    const hoy = getColombiaDate();
    const diaActual = dias[hoy.getDay()];

    if (horario.instructor_fk !== instructorId) {
      throw new BadRequestException('Este horario no pertenece a usted');
    }

    if (horario.diaSemana !== diaActual) {
      throw new BadRequestException(`Solo puedes iniciar asistencia para clases del día de hoy (${diaActual})`);
    }

    const fechaHoy = getColombiaDateString();
    if (dto.fecha !== fechaHoy) {
      throw new BadRequestException('La fecha de la sesión debe ser hoy');
    }

    // Cierra automáticamente cualquier otra sesión que el instructor haya dejado activa
    // (p. ej. olvidó cerrar la de la mañana antes de iniciar la de la tarde).
    await this.sesionRepo.cerrarActivasDeInstructor(instructorId);

    return this.sesionRepo.crear({
      ...dto,
      instructorId,
      estado: 'activa',
    });
  }

  private async enrichRegistros(registros: AsistenciaRegistro[]) {
    if (registros.length === 0) return [];

    const aprendizIds = [...new Set(registros.map((r) => r.aprendizId))];
    const personaRepo = await this.getPersonaRepo();
    const aprendices = await personaRepo.find({
      where: { id_persona: In(aprendizIds) },
      relations: ['matriculas'],
    });
    const aprendizMap = new Map(aprendices.map((a) => [a.id_persona, a]));

    const enriched = await Promise.all(
      registros.map(async (r) => {
        const aprendiz = aprendizMap.get(r.aprendizId);
        if (aprendiz) {
          const [facePhotoB64, lastAttendancePhotoB64] = await Promise.all([
            aprendiz.facePhotoPath ? readFileToBase64Async(aprendiz.facePhotoPath) : Promise.resolve(null),
            r.facePhotoPath ? readFileToBase64Async(r.facePhotoPath) : Promise.resolve(null),
          ]);
          (r as any).aprendiz = {
            id: aprendiz.id_persona,
            nombre: aprendiz.nombres,
            apellido: aprendiz.apellidos,
            correo: aprendiz.correo,
            numDoc: aprendiz.documento,
            fichaId: aprendiz.matriculas?.[0]?.curso_fk ?? null,
            facePhoto: facePhotoB64,
          };
          (r as any).lastAttendancePhoto = lastAttendancePhotoB64;
        }
        return r;
      }),
    );
    return enriched;
  }

  async findById(id: string) {
    const sesion = await this.sesionRepo.buscarPorId(id);
    if (!sesion) throw new NotFoundException('Sesión no encontrada');

    const registros = await this.registroRepo.buscarPorSesion(id);
    const enrichedRegistros = await this.enrichRegistros(registros);
    return { ...sesion, registros: enrichedRegistros };
  }

  async findActivaByHorario(horarioId: string) {
    const sesion = await this.sesionRepo.buscarActivaPorHorario(horarioId);
    if (!sesion) return null;
    const registros = await this.registroRepo.buscarPorSesion(sesion.id);
    const enrichedRegistros = await this.enrichRegistros(registros);
    return { ...sesion, registros: enrichedRegistros };
  }

  async findActivasByInstructor(instructorId: string) {
    const sesiones = await this.sesionRepo.buscarActivasPorInstructor(instructorId);
    const result: any[] = [];
    for (const sesion of sesiones) {
      const registros = await this.registroRepo.buscarPorSesion(sesion.id);
      const enrichedRegistros = await this.enrichRegistros(registros);
      result.push({ ...sesion, registros: enrichedRegistros });
    }
    return result;
  }

  async findActivaByFicha(fichaId: string) {
    const horarioRepo = await this.getHorarioRepo();
    const horarios = await horarioRepo.find({ where: { curso_fk: fichaId } });
    const horarioIds = horarios.map((h) => h.id_horario);

    const sesion = await this.sesionRepo.buscarActivaPorHorarioIds(horarioIds);
    if (!sesion) return null;
    const registros = await this.registroRepo.buscarPorSesion(sesion.id);
    const enrichedRegistros = await this.enrichRegistros(registros);
    return { ...sesion, registros: enrichedRegistros };
  }

  async cerrar(id: string) {
    const sesion = await this.sesionRepo.buscarPorId(id);
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    sesion.estado = 'cerrada';
    return this.sesionRepo.guardar(sesion);
  }

  /** Historial de sesiones para el panel de admin, filtrable por fecha, ficha e instructor.
   *  Trae ficha/ambiente/instructor enriquecidos y el conteo de registros por sesión. */
  async getHistorial(filtros: { fecha?: string; fichaId?: string; instructorId?: string }) {
    const horarioRepo = await this.getHorarioRepo();

    let horarioIdsFiltro: string[] | undefined;
    if (filtros.fichaId) {
      const horariosFicha = await horarioRepo.find({ where: { curso_fk: filtros.fichaId } });
      horarioIdsFiltro = horariosFicha.map((h) => h.id_horario);
      if (!horarioIdsFiltro.length) return [];
    }

    const sesiones = await this.sesionRepo.buscarPorFiltros({
      fecha: filtros.fecha,
      horarioIds: horarioIdsFiltro,
      instructorId: filtros.instructorId,
    });
    if (!sesiones.length) return [];

    const allHorarioIds = [...new Set(sesiones.map((s) => s.horarioId))];
    const horarios = await horarioRepo.find({ where: { id_horario: In(allHorarioIds) } });
    const horarioMap = new Map(horarios.map((h) => [h.id_horario, h]));

    const cursoRepo = await this.connectionManager.getTenantRepository(this.tenantId, CursoOrmEntity);
    const cursoIds = [...new Set(horarios.map((h) => h.curso_fk).filter(Boolean))];
    const cursos = cursoIds.length
      ? await cursoRepo.find({ where: { id_curso: In(cursoIds) }, relations: ['programa'] })
      : [];
    const cursoMap = new Map(cursos.map((c) => [c.id_curso, c]));

    const ambienteRepo = await this.connectionManager.getTenantRepository(this.tenantId, AmbienteOrmEntity);
    const ambienteIds = [...new Set(horarios.map((h) => h.ambiente_fk).filter(Boolean))];
    const ambientes = ambienteIds.length
      ? await ambienteRepo.find({ where: { id_ambiente: In(ambienteIds) } })
      : [];
    const ambienteMap = new Map(ambientes.map((a) => [a.id_ambiente, a]));

    const instructorRepo = await this.connectionManager.getTenantRepository(this.tenantId, InstructorOrmEntity);
    const instructorIds = [...new Set(sesiones.map((s) => s.instructorId).filter(Boolean))];
    const instructores = instructorIds.length
      ? await instructorRepo.find({ where: { id_instructor: In(instructorIds) }, relations: ['persona'] })
      : [];
    const instructorMap = new Map(instructores.map((i) => [i.id_instructor, i]));

    const sesionIds = sesiones.map((s) => s.id);
    const registros = await this.registroRepo.buscarPorSesiones(sesionIds);
    const registrosPorSesion = new Map<string, AsistenciaRegistro[]>();
    for (const r of registros) {
      const list = registrosPorSesion.get(r.sesionId) ?? [];
      list.push(r);
      registrosPorSesion.set(r.sesionId, list);
    }

    return sesiones.map((s) => {
      const horario = horarioMap.get(s.horarioId);
      const curso = horario ? cursoMap.get(horario.curso_fk) : undefined;
      const ambiente = horario?.ambiente_fk ? ambienteMap.get(horario.ambiente_fk) : undefined;
      const instructor = instructorMap.get(s.instructorId);
      return {
        id: s.id,
        fecha: s.fecha,
        horaInicio: s.horaInicio,
        horaFin: s.horaFin,
        estado: s.estado,
        ficha: curso ? { id: curso.id_curso, codigo: curso.codigo, programa: curso.programa?.nombre ?? '' } : null,
        ambiente: ambiente ? { id: ambiente.id_ambiente, nombre: ambiente.nombre } : null,
        instructor: instructor
          ? { id: instructor.id_instructor, nombre: instructor.persona?.nombres ?? '', apellido: instructor.persona?.apellidos ?? null }
          : null,
        registros: registrosPorSesion.get(s.id) ?? [],
      };
    });
  }

  async getPendientes(sesionId: string) {
    const sesion = await this.sesionRepo.buscarPorId(sesionId);
    if (!sesion) throw new NotFoundException('Sesión no encontrada');

    const horarioRepo = await this.getHorarioRepo();
    const horario = await horarioRepo.findOne({ where: { id_horario: sesion.horarioId } });
    if (!horario) return [];

    const registros = await this.registroRepo.buscarPorSesion(sesionId);
    const aprendizIdsConRegistro = registros.map((r) => r.aprendizId);

    const matriculaRepo = await this.connectionManager.getTenantRepository(this.tenantId, MatriculaOrmEntity);
    const matriculas = await matriculaRepo.find({ where: { curso_fk: horario.curso_fk }, relations: ['persona'] });
    return matriculas
      .map((m) => m.persona)
      .filter((p): p is PersonaOrmEntity => !!p && !aprendizIdsConRegistro.includes(p.id_persona))
      .map((p) => ({
        id: p.id_persona,
        nombre: p.nombres,
        apellido: p.apellidos,
        correo: p.correo,
        documento: p.documento,
        facePhoto: null,
      }));
  }

  /** Reporte mensual de una ficha: sesiones del mes agrupadas por semana (semana = tramo de 7 días
   *  del mes: 1-7, 8-14, ...), con una fila por aprendiz matriculado por cada sesión dictada.
   *  Quien no tiene registro en una sesión se considera "ausente". */
  async getReporteMensual(fichaId: string, anio: number, mes: number) {
    const horarioRepo = await this.getHorarioRepo();
    const horarios = await horarioRepo.find({ where: { curso_fk: fichaId } });
    if (!horarios.length) {
      return { fichaId, anio, mes, totalSesiones: 0, resumenAprendices: [], semanas: [] };
    }
    const horarioIds = horarios.map((h) => h.id_horario);
    const horarioMap = new Map(horarios.map((h) => [h.id_horario, h]));

    const matriculaRepo = await this.connectionManager.getTenantRepository(this.tenantId, MatriculaOrmEntity);
    const matriculas = await matriculaRepo.find({ where: { curso_fk: fichaId }, relations: ['persona'] });
    const aprendices = matriculas
      .map((m) => m.persona)
      .filter((p): p is PersonaOrmEntity => !!p);

    const pad = (n: number) => String(n).padStart(2, '0');
    const ultimoDia = new Date(anio, mes, 0).getDate();
    const inicioStr = `${anio}-${pad(mes)}-01`;
    const finStr = `${anio}-${pad(mes)}-${pad(ultimoDia)}`;

    const sesiones = await this.sesionRepo.buscarPorHorarioIdsYRangoFecha(horarioIds, inicioStr, finStr);

    if (!sesiones.length) {
      return { fichaId, anio, mes, totalSesiones: 0, resumenAprendices: [], semanas: [] };
    }

    const sesionIds = sesiones.map((s) => s.id);
    const registros = await this.registroRepo.buscarPorSesiones(sesionIds);
    const registroMap = new Map(registros.map((r) => [`${r.sesionId}_${r.aprendizId}`, r]));

    const semanaDelMes = (diaDelMes: number) => {
      const numero = Math.ceil(diaDelMes / 7);
      const inicioDia = (numero - 1) * 7 + 1;
      const finDia = Math.min(numero * 7, ultimoDia);
      return { numero, inicio: `${anio}-${pad(mes)}-${pad(inicioDia)}`, fin: `${anio}-${pad(mes)}-${pad(finDia)}` };
    };

    const semanasMap = new Map<number, { fechaInicio: string; fechaFin: string; filas: any[] }>();

    for (const sesion of sesiones) {
      const horario = horarioMap.get(sesion.horarioId);
      const diaDelMes = Number(sesion.fecha.split('-')[2]);
      const { numero, inicio, fin } = semanaDelMes(diaDelMes);

      if (!semanasMap.has(numero)) {
        semanasMap.set(numero, { fechaInicio: inicio, fechaFin: fin, filas: [] });
      }
      const semana = semanasMap.get(numero)!;

      for (const aprendiz of aprendices) {
        const registro = registroMap.get(`${sesion.id}_${aprendiz.id_persona}`);
        semana.filas.push({
          sesionId: sesion.id,
          fecha: sesion.fecha,
          diaSemana: horario?.diaSemana ?? null,
          aprendizId: aprendiz.id_persona,
          nombre: aprendiz.nombres,
          apellido: aprendiz.apellidos,
          documento: aprendiz.documento,
          estado: registro?.estado ?? 'ausente',
          horaRegistro: registro?.horaRegistro ?? null,
          ipAddress: registro?.ipAddress ?? null,
          firmaImagen: registro?.firmaImagen ?? null,
        });
      }
    }

    const semanas = [...semanasMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([numero, data]) => ({ numero, ...data }));

    const resumenAprendices = aprendices.map((aprendiz) => {
      let presentes = 0;
      let justificadas = 0;
      let ausencias = 0;
      for (const sesion of sesiones) {
        const registro = registroMap.get(`${sesion.id}_${aprendiz.id_persona}`);
        if (registro?.estado === 'presente') presentes++;
        else if (registro?.estado === 'falla_justificada') justificadas++;
        else ausencias++;
      }
      const total = sesiones.length;
      return {
        aprendizId: aprendiz.id_persona,
        nombre: aprendiz.nombres,
        apellido: aprendiz.apellidos,
        documento: aprendiz.documento,
        totalSesiones: total,
        presentes,
        ausencias,
        justificadas,
        porcentajeAsistencia: total > 0 ? Math.round((presentes / total) * 100) : 0,
      };
    });

    return { fichaId, anio, mes, totalSesiones: sesiones.length, resumenAprendices, semanas };
  }
}
