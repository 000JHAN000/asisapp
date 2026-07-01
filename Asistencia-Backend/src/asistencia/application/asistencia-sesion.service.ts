import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { In } from 'typeorm';
import { AsistenciaSesionTenantEntity } from '../infrastructure/entities/tenant/asistencia-sesion.tenant-entity';
import { AsistenciaRegistroTenantEntity } from '../infrastructure/entities/tenant/asistencia-registro.tenant-entity';
import { FormacionAsistenciaTenantEntity } from '../infrastructure/entities/tenant/formacion-asistencia.tenant-entity';
import { HorarioOrmEntity } from '../../horario/infrastructure/entities/horario.orm-entity';
import { PersonaOrmEntity } from '../../persona/infrastructure/entities/persona.orm-entity';
import { MatriculaOrmEntity } from '../../matricula/infrastructure/entities/matricula.orm-entity';
import { CreateAsistenciaSesionDto } from '../infrastructure/http/dto/create-asistencia-sesion.dto';
import { readFileToBase64Async } from '../../infrastructure/utils/file-storage.util';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class AsistenciaSesionService {
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

  private async getSesionRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, AsistenciaSesionTenantEntity);
  }

  private async getRegistroRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, AsistenciaRegistroTenantEntity);
  }

  private async getFormacionRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, FormacionAsistenciaTenantEntity);
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
    const hoy = new Date();
    const diaActual = dias[hoy.getDay()];

    if (horario.instructor_fk !== instructorId) {
      throw new BadRequestException('Este horario no pertenece a usted');
    }

    if (horario.diaSemana !== diaActual) {
      throw new BadRequestException(`Solo puedes iniciar asistencia para clases del día de hoy (${diaActual})`);
    }

    const fechaHoy = hoy.toISOString().split('T')[0];
    if (dto.fecha !== fechaHoy) {
      throw new BadRequestException('La fecha de la sesión debe ser hoy');
    }

    const formacionRepo = await this.getFormacionRepo();
    let formacion = await formacionRepo.findOne({
      where: {
        horario_fk: dto.horarioId,
        fecha: new Date(dto.fecha),
      },
    });
    if (!formacion) {
      formacion = formacionRepo.create({
        horario_fk: dto.horarioId,
        fecha: new Date(dto.fecha),
        hora_inicio: dto.horaInicio,
        hora_fin: dto.horaFin,
      });
      formacion = await formacionRepo.save(formacion);
    }

    const sesionRepo = await this.getSesionRepo();
    await sesionRepo.update(
      { horarioId: dto.horarioId, estado: 'activa' },
      { estado: 'cerrada' },
    );

    const sesion = sesionRepo.create({
      ...dto,
      instructorId,
      estado: 'activa',
      formacionAsistenciaId: formacion.id_formacion,
    });
    return sesionRepo.save(sesion);
  }

  private async enrichRegistros(registros: AsistenciaRegistroTenantEntity[]) {
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
    const sesionRepo = await this.getSesionRepo();
    const sesion = await sesionRepo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');

    const registroRepo = await this.getRegistroRepo();
    const registros = await registroRepo.find({ where: { sesionId: id } });
    const enrichedRegistros = await this.enrichRegistros(registros);
    return { ...sesion, registros: enrichedRegistros };
  }

  async findActivaByHorario(horarioId: string) {
    const sesionRepo = await this.getSesionRepo();
    const sesion = await sesionRepo.findOne({
      where: { horarioId, estado: 'activa' },
    });
    if (!sesion) return null;
    const registroRepo = await this.getRegistroRepo();
    const registros = await registroRepo.find({ where: { sesionId: sesion.id } });
    const enrichedRegistros = await this.enrichRegistros(registros);
    return { ...sesion, registros: enrichedRegistros };
  }

  async findActivasByInstructor(instructorId: string) {
    const sesionRepo = await this.getSesionRepo();
    const sesiones = await sesionRepo.find({
      where: { instructorId, estado: 'activa' },
    });
    const registroRepo = await this.getRegistroRepo();
    const result: any[] = [];
    for (const sesion of sesiones) {
      const registros = await registroRepo.find({ where: { sesionId: sesion.id } });
      const enrichedRegistros = await this.enrichRegistros(registros);
      result.push({ ...sesion, registros: enrichedRegistros });
    }
    return result;
  }

  async findActivaByFicha(fichaId: string) {
    const sesionRepo = await this.getSesionRepo();
    const sesion = await sesionRepo
      .createQueryBuilder('sesion')
      .where('sesion.estado = :estado', { estado: 'activa' })
      .andWhere('sesion.horarioId IN (SELECT h.id_horario::varchar FROM horario_orm_entity h WHERE h.curso_fk = :fichaId::uuid)', { fichaId })
      .getOne();

    if (!sesion) return null;
    const registroRepo = await this.getRegistroRepo();
    const registros = await registroRepo.find({ where: { sesionId: sesion.id } });
    const enrichedRegistros = await this.enrichRegistros(registros);
    return { ...sesion, registros: enrichedRegistros };
  }

  async cerrar(id: string) {
    const sesionRepo = await this.getSesionRepo();
    const sesion = await sesionRepo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    sesion.estado = 'cerrada';
    return sesionRepo.save(sesion);
  }

  async getPendientes(sesionId: string) {
    const sesionRepo = await this.getSesionRepo();
    const sesion = await sesionRepo.findOne({ where: { id: sesionId } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');

    const horarioRepo = await this.getHorarioRepo();
    const horario = await horarioRepo.findOne({ where: { id_horario: sesion.horarioId } });
    if (!horario) return [];

    const registroRepo = await this.getRegistroRepo();
    const registros = await registroRepo.find({ where: { sesionId } });
    const aprendizIdsConRegistro = registros.map((r) => r.aprendizId);

    const matriculaRepo = await this.connectionManager.getTenantRepository(this.tenantId, MatriculaOrmEntity);
    const matriculas = await matriculaRepo.find({ where: { curso_fk: horario.curso_fk }, relations: ['persona'] });
    return matriculas
      .map((m) => m.persona)
      .filter((p): p is PersonaOrmEntity => !!p && !aprendizIdsConRegistro.includes(p.id_persona));
  }
}
