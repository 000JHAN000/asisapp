import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AsistenciaSesionOrmEntity } from '../infrastructure/entities/asistencia-sesion.orm-entity';
import { AsistenciaRegistroOrmEntity } from '../infrastructure/entities/asistencia-registro.orm-entity';
import { FormacionAsistenciaOrmEntity } from '../infrastructure/entities/formacion-asistencia.orm-entity';
import { HorarioCG } from '../../chronogest/entities/horario-cg.entity';
import { AprendizCG } from '../../chronogest/entities/aprendiz-cg.entity';
import { CreateAsistenciaSesionDto } from '../infrastructure/http/dto/create-asistencia-sesion.dto';
import { readFileToBase64Async } from '../../chronogest/utils/file-storage.util';

@Injectable()
export class AsistenciaSesionService {
  constructor(
    @InjectRepository(AsistenciaSesionOrmEntity)
    private readonly sesionRepo: Repository<AsistenciaSesionOrmEntity>,
    @InjectRepository(AsistenciaRegistroOrmEntity)
    private readonly registroRepo: Repository<AsistenciaRegistroOrmEntity>,
    @InjectRepository(HorarioCG)
    private readonly horarioRepo: Repository<HorarioCG>,
    @InjectRepository(AprendizCG)
    private readonly aprendizRepo: Repository<AprendizCG>,
    @InjectRepository(FormacionAsistenciaOrmEntity)
    private readonly formacionRepo: Repository<FormacionAsistenciaOrmEntity>,
  ) {}

  async create(dto: CreateAsistenciaSesionDto, instructorId: string) {
    const horario = await this.horarioRepo.findOne({ where: { id: dto.horarioId } });
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

    // Buscar o crear formación de asistencia legacy vinculada a este horario ChronoGest
    let formacion = await this.formacionRepo.findOne({
      where: {
        cgHorarioId: dto.horarioId,
        fecha: new Date(dto.fecha),
      },
    });
    if (!formacion) {
      formacion = this.formacionRepo.create({
        cgHorarioId: dto.horarioId,
        fecha: new Date(dto.fecha),
        hora_inicio: dto.horaInicio,
        hora_fin: dto.horaFin,
      });
      formacion = await this.formacionRepo.save(formacion);
    }

    // Cerrar sesiones activas previas del mismo horario
    await this.sesionRepo.update(
      { horarioId: dto.horarioId, estado: 'activa' },
      { estado: 'cerrada' },
    );

    const sesion = this.sesionRepo.create({
      ...dto,
      instructorId,
      estado: 'activa',
      formacionAsistenciaId: formacion.id_formacion,
    });
    return this.sesionRepo.save(sesion);
  }

  private async enrichRegistros(registros: AsistenciaRegistroOrmEntity[]) {
    if (registros.length === 0) return [];

    // Una sola query para todos los aprendices
    const aprendizIds = [...new Set(registros.map((r) => r.aprendizId))];
    const aprendices = await this.aprendizRepo.find({
      where: { id: In(aprendizIds) },
    });
    const aprendizMap = new Map(aprendices.map((a) => [a.id, a]));

    // Paralelizar lecturas de archivos + enriquecimiento
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
    const sesion = await this.sesionRepo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    
    const registros = await this.registroRepo.find({ where: { sesionId: id } });
    const enrichedRegistros = await this.enrichRegistros(registros);
    return { ...sesion, registros: enrichedRegistros };
  }

  async findActivaByHorario(horarioId: string) {
    const sesion = await this.sesionRepo.findOne({
      where: { horarioId, estado: 'activa' },
    });
    if (!sesion) return null;
    const registros = await this.registroRepo.find({ where: { sesionId: sesion.id } });
    const enrichedRegistros = await this.enrichRegistros(registros);
    return { ...sesion, registros: enrichedRegistros };
  }

  async findActivasByInstructor(instructorId: string) {
    const sesiones = await this.sesionRepo.find({
      where: { instructorId, estado: 'activa' },
    });
    const result: any[] = [];
    for (const sesion of sesiones) {
      const registros = await this.registroRepo.find({ where: { sesionId: sesion.id } });
      const enrichedRegistros = await this.enrichRegistros(registros);
      result.push({ ...sesion, registros: enrichedRegistros });
    }
    return result;
  }

  async findActivaByFicha(fichaId: string) {
    // Buscar horarios de la ficha y luego sesiones activas
    const sesion = await this.sesionRepo
      .createQueryBuilder('sesion')
      .where('sesion.estado = :estado', { estado: 'activa' })
      .andWhere('sesion.horarioId IN (SELECT h.id::varchar FROM cg_horarios h WHERE h."fichaId" = :fichaId::varchar)', { fichaId })
      .getOne();
    
    if (!sesion) return null;
    const registros = await this.registroRepo.find({ where: { sesionId: sesion.id } });
    const enrichedRegistros = await this.enrichRegistros(registros);
    return { ...sesion, registros: enrichedRegistros };
  }

  async cerrar(id: string) {
    const sesion = await this.sesionRepo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    sesion.estado = 'cerrada';
    return this.sesionRepo.save(sesion);
  }

  async getPendientes(sesionId: string) {
    const sesion = await this.sesionRepo.findOne({ where: { id: sesionId } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');

    const horario = await this.horarioRepo.findOne({ where: { id: sesion.horarioId } });
    if (!horario) return [];

    const registros = await this.registroRepo.find({ where: { sesionId } });
    const aprendizIdsConRegistro = registros.map((r) => r.aprendizId);

    const aprendices = await this.aprendizRepo.find({ where: { fichaId: horario.fichaId } });
    return aprendices.filter((a) => !aprendizIdsConRegistro.includes(a.id));
  }
}
