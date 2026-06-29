import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { In } from 'typeorm';
import { AsistenciaSesionTenantEntity } from '../infrastructure/entities/tenant/asistencia-sesion.tenant-entity';
import { AsistenciaRegistroTenantEntity } from '../infrastructure/entities/tenant/asistencia-registro.tenant-entity';
import { FormacionAsistenciaTenantEntity } from '../infrastructure/entities/tenant/formacion-asistencia.tenant-entity';
import { HorarioCG } from '../../chronogest/entities/horario-cg.entity';
import { AprendizCG } from '../../chronogest/entities/aprendiz-cg.entity';
import { CreateAsistenciaSesionDto } from '../infrastructure/http/dto/create-asistencia-sesion.dto';
import { readFileToBase64Async } from '../../chronogest/utils/file-storage.util';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
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
    return this.connectionManager.getTenantRepository(this.tenantId, HorarioCG);
  }

  private async getAprendizRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, AprendizCG);
  }

  async create(dto: CreateAsistenciaSesionDto, instructorId: string) {
    const horarioRepo = await this.getHorarioRepo();
    const horario = await horarioRepo.findOne({ where: { id: dto.horarioId } });
    if (!horario) throw new BadRequestException('Horario no encontrado');

    const dias = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
    const hoy = new Date();
    const diaActual = dias[hoy.getDay()];

    if (horario.instructorId !== instructorId) {
      throw new BadRequestException('Este horario no pertenece a usted');
    }

    if (horario.diaSemana !== diaActual) {
      throw new BadRequestException(`Solo puedes iniciar asistencia para clases del día de hoy (${diaActual})`);
    }

    const fechaHoy = hoy.toLocaleDateString('en-CA');
    if (dto.fecha !== fechaHoy) {
      throw new BadRequestException('La fecha de la sesión debe ser hoy');
    }

    const formacionRepo = await this.getFormacionRepo();
    let formacion = await formacionRepo.findOne({
      where: {
        cgHorarioId: dto.horarioId,
        fecha: new Date(dto.fecha),
      },
    });
    if (!formacion) {
      formacion = formacionRepo.create({
        cgHorarioId: dto.horarioId,
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
    const aprendizRepo = await this.getAprendizRepo();
    const aprendices = await aprendizRepo.find({
      where: { id: In(aprendizIds) },
    });
    const aprendizMap = new Map(aprendices.map((a) => [a.id, a]));

    const enriched = await Promise.all(
      registros.map(async (r) => {
        const aprendiz = aprendizMap.get(r.aprendizId);
        if (aprendiz) {
          const [facePhotoB64, lastAttendancePhotoB64] = await Promise.all([
            aprendiz.facePhotoPath ? readFileToBase64Async(aprendiz.facePhotoPath) : Promise.resolve(null),
            r.facePhotoPath ? readFileToBase64Async(r.facePhotoPath) : Promise.resolve(null),
          ]);
          (r as any).aprendiz = {
            id: aprendiz.id,
            nombre: aprendiz.nombre,
            apellido: aprendiz.apellido,
            correo: aprendiz.correo,
            numDoc: aprendiz.documento,
            fichaId: aprendiz.fichaId,
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
      .andWhere('sesion.horarioId IN (SELECT h.id::varchar FROM cg_horarios h WHERE h."fichaId" = :fichaId::varchar)', { fichaId })
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
    const horario = await horarioRepo.findOne({ where: { id: sesion.horarioId } });
    if (!horario) return [];

    const registroRepo = await this.getRegistroRepo();
    const registros = await registroRepo.find({ where: { sesionId } });
    const aprendizIdsConRegistro = registros.map((r) => r.aprendizId);

    const aprendizRepo = await this.getAprendizRepo();
    const aprendices = await aprendizRepo.find({ where: { fichaId: horario.fichaId } });
    return aprendices.filter((a) => !aprendizIdsConRegistro.includes(a.id));
  }
}
