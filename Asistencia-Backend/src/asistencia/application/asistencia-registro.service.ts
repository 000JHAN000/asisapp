import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AsistenciaRegistroOrmEntity } from '../infrastructure/entities/asistencia-registro.orm-entity';
import { AsistenciaSesionOrmEntity } from '../infrastructure/entities/asistencia-sesion.orm-entity';
import { AsistenciaOrmEntity } from '../infrastructure/entities/asistencia.orm-entity';
import { EstadoAsistencia } from '../domain/entities/asistencia.entity';
import { CreateAsistenciaRegistroDto } from '../infrastructure/http/dto/create-asistencia-registro.dto';
import { MarcarFallaDto } from '../infrastructure/http/dto/marcar-falla.dto';
import { VerificarRostroDto } from '../infrastructure/http/dto/verificar-rostro.dto';
import { AprendizCG } from '../../chronogest/entities/aprendiz-cg.entity';
import { getBaseFacePath, getAttendanceFacePath, readFileToBase64, saveAttendanceFace } from '../../chronogest/utils/file-storage.util';

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5000';

@Injectable()
export class AsistenciaRegistroService {
  constructor(
    @InjectRepository(AsistenciaRegistroOrmEntity)
    private readonly registroRepo: Repository<AsistenciaRegistroOrmEntity>,
    @InjectRepository(AsistenciaSesionOrmEntity)
    private readonly sesionRepo: Repository<AsistenciaSesionOrmEntity>,
    @InjectRepository(AprendizCG)
    private readonly aprendizRepo: Repository<AprendizCG>,
    @InjectRepository(AsistenciaOrmEntity)
    private readonly asistenciaRepo: Repository<AsistenciaOrmEntity>,
    private readonly http: HttpService,
  ) {}

  async verificarRostro(dto: VerificarRostroDto) {
    const aprendiz = await this.aprendizRepo.findOne({
      where: dto.documento ? { documento: dto.documento } : { id: dto.aprendizId }
    });
    if (!aprendiz) throw new NotFoundException('Aprendiz no encontrado');
    if (!aprendiz.facePhotoPath) {
      throw new ForbiddenException('El aprendiz no tiene rostro registrado');
    }

    const baseFacePath = getBaseFacePath(aprendiz.id);
    if (!baseFacePath) {
      throw new ForbiddenException('Foto base no encontrada en el servidor');
    }
    const baseFaceB64 = readFileToBase64(baseFacePath);

    const lastAttendancePath = getAttendanceFacePath(aprendiz.id);
    const lastFaceB64 = lastAttendancePath ? readFileToBase64(lastAttendancePath) : null;

    try {
      const payload: any = {
        base_image: baseFaceB64,
        verify_image: dto.faceVerificationImage,
      };
      if (lastFaceB64) {
        payload.last_image = lastFaceB64;
      }

      const verifyResponse: any = await firstValueFrom(
        this.http.post(`${FACE_SERVICE_URL}/verify-secure`, payload),
      );

      const verifyData = verifyResponse.data;
      return {
        success: verifyData.success,
        verified: verifyData.verified,
        message: verifyData.message,
        details: verifyData.details || {},
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      if (err.response?.status === 403) {
        throw new ForbiddenException(err.response?.data?.message || 'Verificación facial fallida');
      }
      throw new ForbiddenException('Error en servicio de reconocimiento facial: ' + (err.message || ''));
    }
  }

  async registrarFirma(dto: CreateAsistenciaRegistroDto) {
    const sesion = await this.sesionRepo.findOne({
      where: { id: dto.sesionId },
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    if (sesion.estado !== 'activa') throw new ForbiddenException('La sesión no está activa');

    // Verificar que el aprendiz no haya firmado ya
    const existente = await this.registroRepo.findOne({
      where: { sesionId: dto.sesionId, aprendizId: dto.aprendizId },
    });
    if (existente) {
      throw new ForbiddenException('El aprendiz ya registró su asistencia');
    }

    // Obtener aprendiz y su foto base
    const aprendiz = await this.aprendizRepo.findOne({ 
      where: dto.documento ? { documento: dto.documento } : { id: dto.aprendizId } 
    });
    if (!aprendiz) throw new NotFoundException('Aprendiz no encontrado');
    if (!aprendiz.facePhotoPath) {
      throw new ForbiddenException('El aprendiz no tiene rostro registrado');
    }

    // ── Guardar foto de asistencia ─────────────────────────────────
    // Nota: la verificación facial ya se hizo en /verificar-rostro
    // para reducir demora, aquí solo guardamos el registro.
    let attendancePhotoPath: string | null = null;
    if (dto.faceVerificationImage) {
      attendancePhotoPath = saveAttendanceFace(aprendiz.id, dto.faceVerificationImage);
    }

    // Buscar o crear asistencia legacy vinculada a la sesión y al aprendiz
    let asistenciaId: string | null = null;
    if (sesion.formacionAsistenciaId) {
      const horaActual = new Date().toLocaleTimeString('en-GB', { hour12: false });
      let asistencia = await this.asistenciaRepo.findOne({
        where: {
          formacion_fk: sesion.formacionAsistenciaId,
          aprendizId: aprendiz.id,
        },
      });
      if (asistencia) {
        asistencia.estado = EstadoAsistencia.asistio;
        asistencia.hora = horaActual;
        asistencia = await this.asistenciaRepo.save(asistencia);
      } else {
        asistencia = await this.asistenciaRepo.save(
          this.asistenciaRepo.create({
            formacion_fk: sesion.formacionAsistenciaId,
            aprendizId: aprendiz.id,
            estado: EstadoAsistencia.asistio,
            hora: horaActual,
          }),
        );
      }
      asistenciaId = asistencia.id_asistencia;
    }

    // Crear registro de firma
    const registro = this.registroRepo.create({
      sesionId: dto.sesionId,
      aprendizId: aprendiz.id,
      estado: 'presente',
      firmaImagen: dto.firmaImagen,
      facePhotoPath: attendancePhotoPath,
      ipAddress: dto.ipAddress,
      latitud: dto.latitud,
      longitud: dto.longitud,
      asistenciaId,
    } as any);

    const savedResult = await this.registroRepo.save(registro);
    const saved = Array.isArray(savedResult) ? savedResult[0] : savedResult;

    // Actualizar lastAttendancePhotoPath del aprendiz
    if (attendancePhotoPath) {
      await this.aprendizRepo.update(aprendiz.id, {
        lastAttendancePhotoPath: attendancePhotoPath,
      });
    }

    let facePhotoB64: string | null = null;
    if (aprendiz.facePhotoPath) {
      facePhotoB64 = readFileToBase64(aprendiz.facePhotoPath);
    }

    let lastAttendancePhotoB64: string | null = null;
    if (saved.facePhotoPath) {
      lastAttendancePhotoB64 = readFileToBase64(saved.facePhotoPath);
    }

    (saved as any).aprendiz = {
      id: aprendiz.id,
      nombre: aprendiz.nombre,
      apellido: aprendiz.apellido,
      correo: aprendiz.correo,
      numDoc: aprendiz.documento,
      fichaId: aprendiz.fichaId,
      facePhoto: facePhotoB64,
    };
    (saved as any).lastAttendancePhoto = lastAttendancePhotoB64;

    return saved;
  }

  async marcarFallaJustificada(dto: MarcarFallaDto) {
    const sesion = await this.sesionRepo.findOne({
      where: { id: dto.sesionId },
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');

    const existente = await this.registroRepo.findOne({
      where: { sesionId: dto.sesionId, aprendizId: dto.aprendizId },
    });

    // Buscar o crear asistencia legacy para falla justificada
    let asistenciaId: string | null = null;
    if (sesion.formacionAsistenciaId) {
      const horaActual = new Date().toLocaleTimeString('en-GB', { hour12: false });
      let asistencia = await this.asistenciaRepo.findOne({
        where: {
          formacion_fk: sesion.formacionAsistenciaId,
          aprendizId: dto.aprendizId,
        },
      });
      if (asistencia) {
        asistencia.estado = EstadoAsistencia.excusa;
        asistencia.hora = horaActual;
        asistencia = await this.asistenciaRepo.save(asistencia);
      } else {
        asistencia = await this.asistenciaRepo.save(
          this.asistenciaRepo.create({
            formacion_fk: sesion.formacionAsistenciaId,
            aprendizId: dto.aprendizId,
            estado: EstadoAsistencia.excusa,
            hora: horaActual,
          }),
        );
      }
      asistenciaId = asistencia.id_asistencia;
    }

    if (existente) {
      existente.estado = 'falla_justificada';
      existente.nota = dto.nota || undefined;
      existente.soporteUrl = dto.soporte || undefined;
      existente.asistenciaId = asistenciaId;
      return this.registroRepo.save(existente);
    }

    const registro = this.registroRepo.create({
      sesionId: dto.sesionId,
      aprendizId: dto.aprendizId,
      estado: 'falla_justificada',
      nota: dto.nota || undefined,
      soporteUrl: dto.soporte || undefined,
      asistenciaId,
    } as any);
    return this.registroRepo.save(registro);
  }
}
