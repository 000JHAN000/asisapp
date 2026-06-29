import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AsistenciaRegistroTenantEntity } from '../infrastructure/entities/tenant/asistencia-registro.tenant-entity';
import { AsistenciaSesionTenantEntity } from '../infrastructure/entities/tenant/asistencia-sesion.tenant-entity';
import { AsistenciaTenantEntity } from '../infrastructure/entities/tenant/asistencia.tenant-entity';
import { EstadoAsistencia } from '../domain/entities/asistencia.entity';
import { CreateAsistenciaRegistroDto } from '../infrastructure/http/dto/create-asistencia-registro.dto';
import { MarcarFallaDto } from '../infrastructure/http/dto/marcar-falla.dto';
import { VerificarRostroDto } from '../infrastructure/http/dto/verificar-rostro.dto';
import { AprendizCG } from '../../chronogest/entities/aprendiz-cg.entity';
import { getBaseFacePath, getAttendanceFacePath, readFileToBase64, saveAttendanceFace } from '../../chronogest/utils/file-storage.util';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5000';

@Injectable()
export class AsistenciaRegistroService {
  constructor(
    private readonly connectionManager: TenantConnectionManager,
    private readonly http: HttpService,
  ) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new ForbiddenException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private async getRegistroRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, AsistenciaRegistroTenantEntity);
  }

  private async getSesionRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, AsistenciaSesionTenantEntity);
  }

  private async getAsistenciaRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, AsistenciaTenantEntity);
  }

  private async getAprendizRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, AprendizCG);
  }

  async verificarRostro(dto: VerificarRostroDto) {
    const aprendizRepo = await this.getAprendizRepo();
    const aprendiz = await aprendizRepo.findOne({
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
    const sesionRepo = await this.getSesionRepo();
    const sesion = await sesionRepo.findOne({
      where: { id: dto.sesionId },
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    if (sesion.estado !== 'activa') throw new ForbiddenException('La sesión no está activa');

    const registroRepo = await this.getRegistroRepo();
    const existente = await registroRepo.findOne({
      where: { sesionId: dto.sesionId, aprendizId: dto.aprendizId },
    });
    if (existente) {
      throw new ForbiddenException('El aprendiz ya registró su asistencia');
    }

    const aprendizRepo = await this.getAprendizRepo();
    const aprendiz = await aprendizRepo.findOne({
      where: dto.documento ? { documento: dto.documento } : { id: dto.aprendizId }
    });
    if (!aprendiz) throw new NotFoundException('Aprendiz no encontrado');
    if (!aprendiz.facePhotoPath) {
      throw new ForbiddenException('El aprendiz no tiene rostro registrado');
    }

    let attendancePhotoPath: string | null = null;
    if (dto.faceVerificationImage) {
      attendancePhotoPath = saveAttendanceFace(aprendiz.id, dto.faceVerificationImage);
    }

    let asistenciaId: string | null = null;
    if (sesion.formacionAsistenciaId) {
      const horaActual = new Date().toLocaleTimeString('en-GB', { hour12: false });
      const asistenciaRepo = await this.getAsistenciaRepo();
      let asistencia = await asistenciaRepo.findOne({
        where: {
          formacion_fk: sesion.formacionAsistenciaId,
          aprendizId: aprendiz.id,
        },
      });
      if (asistencia) {
        asistencia.estado = EstadoAsistencia.asistio;
        asistencia.hora = horaActual;
        asistencia = await asistenciaRepo.save(asistencia);
      } else {
        asistencia = await asistenciaRepo.save(
          asistenciaRepo.create({
            formacion_fk: sesion.formacionAsistenciaId,
            aprendizId: aprendiz.id,
            estado: EstadoAsistencia.asistio,
            hora: horaActual,
          }),
        );
      }
      asistenciaId = asistencia.id_asistencia;
    }

    const registro = registroRepo.create({
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

    const savedResult = await registroRepo.save(registro);
    const saved = Array.isArray(savedResult) ? savedResult[0] : savedResult;

    if (attendancePhotoPath) {
      await aprendizRepo.update(aprendiz.id, {
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
    const sesionRepo = await this.getSesionRepo();
    const sesion = await sesionRepo.findOne({
      where: { id: dto.sesionId },
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');

    const registroRepo = await this.getRegistroRepo();
    const existente = await registroRepo.findOne({
      where: { sesionId: dto.sesionId, aprendizId: dto.aprendizId },
    });

    let asistenciaId: string | null = null;
    if (sesion.formacionAsistenciaId) {
      const horaActual = new Date().toLocaleTimeString('en-GB', { hour12: false });
      const asistenciaRepo = await this.getAsistenciaRepo();
      let asistencia = await asistenciaRepo.findOne({
        where: {
          formacion_fk: sesion.formacionAsistenciaId,
          aprendizId: dto.aprendizId,
        },
      });
      if (asistencia) {
        asistencia.estado = EstadoAsistencia.excusa;
        asistencia.hora = horaActual;
        asistencia = await asistenciaRepo.save(asistencia);
      } else {
        asistencia = await asistenciaRepo.save(
          asistenciaRepo.create({
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
      return registroRepo.save(existente);
    }

    const registro = registroRepo.create({
      sesionId: dto.sesionId,
      aprendizId: dto.aprendizId,
      estado: 'falla_justificada',
      nota: dto.nota || undefined,
      soporteUrl: dto.soporte || undefined,
      asistenciaId,
    } as any);
    return registroRepo.save(registro);
  }
}
