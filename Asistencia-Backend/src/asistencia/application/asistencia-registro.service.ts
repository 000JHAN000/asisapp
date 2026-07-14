import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateAsistenciaRegistroDto } from '../infrastructure/http/dto/create-asistencia-registro.dto';
import { MarcarFallaDto } from '../infrastructure/http/dto/marcar-falla.dto';
import { VerificarRostroDto } from '../infrastructure/http/dto/verificar-rostro.dto';
import { SolicitarJustificacionDto } from '../infrastructure/http/dto/solicitar-justificacion.dto';
import { PersonaOrmEntity } from '../../persona/infrastructure/entities/persona.orm-entity';
import { getBaseFacePath, getAttendanceFacePath, readFileToBase64, saveAttendanceFace } from '../../infrastructure/utils/file-storage.util';
import { getColombiaDate } from '../../infrastructure/utils/date.util';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';
import { ASISTENCIA_SESION_REPOSITORY } from '../domain/ports/asistencia-sesion.repository.port';
import type { AsistenciaSesionRepositoryPort } from '../domain/ports/asistencia-sesion.repository.port';
import { ASISTENCIA_REGISTRO_REPOSITORY } from '../domain/ports/asistencia-registro.repository.port';
import type { AsistenciaRegistroRepositoryPort } from '../domain/ports/asistencia-registro.repository.port';

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5000';

@Injectable()
export class AsistenciaRegistroService {
  constructor(
    private readonly connectionManager: TenantConnectionManager,
    private readonly http: HttpService,
    @Inject(ASISTENCIA_SESION_REPOSITORY)
    private readonly sesionRepo: AsistenciaSesionRepositoryPort,
    @Inject(ASISTENCIA_REGISTRO_REPOSITORY)
    private readonly registroRepo: AsistenciaRegistroRepositoryPort,
  ) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new ForbiddenException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private async getPersonaRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, PersonaOrmEntity);
  }

  async verificarRostro(dto: VerificarRostroDto) {
    const personaRepo = await this.getPersonaRepo();
    const aprendiz = await personaRepo.findOne({
      where: dto.documento ? { documento: dto.documento } : { id_persona: dto.aprendizId }
    });
    if (!aprendiz) throw new NotFoundException('Aprendiz no encontrado');
    if (!aprendiz.facePhotoPath) {
      throw new ForbiddenException('El aprendiz no tiene rostro registrado');
    }

    const baseFacePath = getBaseFacePath(aprendiz.id_persona);
    if (!baseFacePath) {
      throw new ForbiddenException('Foto base no encontrada en el servidor');
    }
    const baseFaceB64 = readFileToBase64(baseFacePath);

    const lastAttendancePath = getAttendanceFacePath(aprendiz.id_persona);
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
    const sesion = await this.sesionRepo.buscarPorId(dto.sesionId);
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    if (sesion.estado !== 'activa') throw new ForbiddenException('La sesión no está activa');

    const existente = await this.registroRepo.buscarUno(dto.sesionId, dto.aprendizId);
    if (existente) {
      throw new ForbiddenException('El aprendiz ya registró su asistencia');
    }

    const personaRepo = await this.getPersonaRepo();
    const aprendiz = await personaRepo.findOne({
      where: dto.documento ? { documento: dto.documento } : { id_persona: dto.aprendizId }
    });
    if (!aprendiz) throw new NotFoundException('Aprendiz no encontrado');
    if (!aprendiz.facePhotoPath) {
      throw new ForbiddenException('El aprendiz no tiene rostro registrado');
    }

    let attendancePhotoPath: string | null = null;
    if (dto.faceVerificationImage) {
      attendancePhotoPath = saveAttendanceFace(aprendiz.id_persona, dto.faceVerificationImage);
    }

    const saved = await this.registroRepo.crear({
      sesionId: dto.sesionId,
      aprendizId: aprendiz.id_persona,
      estado: 'presente',
      firmaImagen: dto.firmaImagen,
      facePhotoPath: attendancePhotoPath ?? undefined,
      ipAddress: dto.ipAddress,
      latitud: dto.latitud,
      longitud: dto.longitud,
      horaRegistro: getColombiaDate(),
    });

    if (attendancePhotoPath) {
      await personaRepo.update({ id_persona: aprendiz.id_persona }, {
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
      id: aprendiz.id_persona,
      nombre: aprendiz.nombres,
      apellido: aprendiz.apellidos,
      correo: aprendiz.correo,
      numDoc: aprendiz.documento,
      fichaId: aprendiz.matriculas?.[0]?.curso_fk ?? null,
      facePhoto: facePhotoB64,
    };
    (saved as any).lastAttendancePhoto = lastAttendancePhotoB64;

    return saved;
  }

  async marcarFallaJustificada(dto: MarcarFallaDto) {
    const sesion = await this.sesionRepo.buscarPorId(dto.sesionId);
    if (!sesion) throw new NotFoundException('Sesión no encontrada');

    const existente = await this.registroRepo.buscarUno(dto.sesionId, dto.aprendizId);

    if (existente) {
      existente.estado = 'falla_justificada';
      existente.nota = dto.nota || undefined;
      existente.soporteUrl = dto.soporte || undefined;
      return this.registroRepo.guardar(existente);
    }

    return this.registroRepo.crear({
      sesionId: dto.sesionId,
      aprendizId: dto.aprendizId,
      estado: 'falla_justificada',
      nota: dto.nota || undefined,
      soporteUrl: dto.soporte || undefined,
      horaRegistro: getColombiaDate(),
    });
  }

  /** El aprendiz sube su propia justificación (nota + soporte opcional) por no haber
   *  firmado una sesión. Queda "pendiente" hasta que el instructor la apruebe o la
   *  rechace — no se marca directamente como falla justificada. */
  async solicitarJustificacion(dto: SolicitarJustificacionDto) {
    const sesion = await this.sesionRepo.buscarPorId(dto.sesionId);
    if (!sesion) throw new NotFoundException('Sesión no encontrada');

    const existente = await this.registroRepo.buscarUno(dto.sesionId, dto.aprendizId);
    if (existente) {
      // Una falla no justificada (p. ej. el instructor le quitó una marca de "presente" falsa)
      // sigue siendo justificable: el aprendiz puede enviar su explicación sobre ese registro.
      if (existente.estado === 'falla_injustificada') {
        existente.estado = 'justificacion_pendiente';
        existente.nota = dto.nota;
        existente.soporteUrl = dto.soporte || undefined;
        return this.registroRepo.guardar(existente);
      }
      throw new ForbiddenException(
        existente.estado === 'presente'
          ? 'Ya registraste tu asistencia a esta sesión.'
          : 'Ya enviaste una justificación para esta sesión.',
      );
    }

    return this.registroRepo.crear({
      sesionId: dto.sesionId,
      aprendizId: dto.aprendizId,
      estado: 'justificacion_pendiente',
      nota: dto.nota,
      soporteUrl: dto.soporte || undefined,
      horaRegistro: getColombiaDate(),
    });
  }

  /** El instructor/admin revisa una justificación enviada por el aprendiz: si la aprueba
   *  queda como falla justificada; si la rechaza, se elimina el registro y el aprendiz
   *  vuelve a quedar "pendiente" (como si nunca hubiera enviado nada). */
  async resolverJustificacion(registroId: string, aprobar: boolean) {
    const registro = await this.registroRepo.buscarPorId(registroId);
    if (!registro) throw new NotFoundException('Justificación no encontrada');
    if (registro.estado !== 'justificacion_pendiente') {
      throw new ForbiddenException('Este registro no es una justificación pendiente de revisión.');
    }

    if (!aprobar) {
      await this.registroRepo.eliminar(registroId);
      return { success: true, aprobada: false };
    }

    registro.estado = 'falla_justificada';
    const guardado = await this.registroRepo.guardar(registro);
    return { success: true, aprobada: true, registro: guardado };
  }

  /** El instructor quita la marca de "presente" de un aprendiz que en realidad no asistió
   *  (p. ej. firmó pero no llegó a clase). El registro queda como falla no justificada
   *  en vez de eliminarse, para que quede constancia de la inasistencia real. */
  async quitarAsistencia(registroId: string) {
    const registro = await this.registroRepo.buscarPorId(registroId);
    if (!registro) throw new NotFoundException('Registro no encontrado');
    if (registro.estado !== 'presente') {
      throw new ForbiddenException('Solo se puede quitar un registro marcado como presente.');
    }
    registro.estado = 'falla_injustificada';
    return this.registroRepo.guardar(registro);
  }
}
