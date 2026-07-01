import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PersonaOrmEntity } from 'src/persona/infrastructure/entities/persona.orm-entity';
import { UsuarioMaestro } from 'src/auth/infrastructure/entities/usuario-maestro.orm-entity';
import { CursoOrmEntity } from 'src/curso/infrastructure/entities/curso.orm-entity';
import { saveBaseFace, readFileToBase64 } from 'src/infrastructure/utils/file-storage.util';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5000';

@Injectable()
export class AprendicesCGService {
  constructor(
    @InjectRepository(UsuarioMaestro)
    private readonly usuarioRepo: Repository<UsuarioMaestro>,
    private readonly connectionManager: TenantConnectionManager,
    private readonly http: HttpService,
  ) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new BadRequestException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private async getPersonaRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, PersonaOrmEntity);
  }

  private async enrichWithTenant(list: PersonaOrmEntity[]) {
    const documentos = list.map((a) => a.documento);
    const usuarios = documentos.length
      ? await this.usuarioRepo.find({ where: { documento: In(documentos) } })
      : [];
    const usuarioMap = new Map(usuarios.map((u) => [u.documento, u]));

    const fichaIds = [
      ...new Set(list.map((a) => a.matriculas?.[0]?.curso_fk).filter(Boolean)),
    ];
    const cursoRepo = await this.connectionManager.getTenantRepository(this.tenantId, CursoOrmEntity);
    const cursos = fichaIds.length
      ? await cursoRepo.find({ where: { id_curso: In(fichaIds as string[]) } })
      : [];
    const fichaMap = new Map(cursos.map((f) => [f.id_curso, f]));

    return Promise.all(
      list.map(async (a) => {
        const u = usuarioMap.get(a.documento);
        const fichaId = a.matriculas?.[0]?.curso_fk;
        const ficha = fichaId ? fichaMap.get(fichaId) : null;
        let tenantNombre: string | null = null;
        if (u?.tenantSlug) {
          try {
            const tenant = await this.connectionManager.resolveTenant(u.tenantSlug);
            tenantNombre = tenant.nombre;
          } catch {
            tenantNombre = null;
          }
        }
        return {
          id: a.id_persona,
          nombre: a.nombres,
          apellido: a.apellidos,
          correo: a.correo,
          documento: a.documento,
          fichaId,
          facePhotoPath: a.facePhotoPath,
          faceEmbedding: a.faceEmbedding,
          lastAttendancePhotoPath: a.lastAttendancePhotoPath,
          tipoDoc: u?.tipoDoc ?? null,
          activo: u?.activo ?? true,
          municipio: u?.municipio ?? null,
          ficha: ficha ? { id: ficha.id_curso, codigo: ficha.codigo, programa: ficha.programa?.nombre ?? '' } : null,
          tenantSlug: u?.tenantSlug ?? null,
          tenantNombre,
        };
      }),
    );
  }

  async findAll() {
    const repo = await this.getPersonaRepo();
    const list = await repo.find({ relations: ['matriculas'] });
    const aprendices = list.filter((p) => p.matriculas?.length);
    return this.enrichWithTenant(aprendices);
  }

  async update(id: string, data: any) {
    const repo = await this.getPersonaRepo();
    await repo.update(
      { id_persona: id },
      {
        nombres: data.nombre,
        apellidos: data.apellido,
        correo: data.correo,
        documento: data.documento,
        facePhotoPath: data.facePhotoPath,
        faceEmbedding: data.faceEmbedding,
        lastAttendancePhotoPath: data.lastAttendancePhotoPath,
      },
    );
    return repo.findOne({ where: { id_persona: id }, relations: ['matriculas'] });
  }

  async getFaceStatus(documento: string) {
    const repo = await this.getPersonaRepo();
    const persona = await repo.findOne({ where: { documento } });
    if (!persona) throw new NotFoundException('Aprendiz no encontrado');

    let facePhotoB64: string | null = null;
    if (persona.facePhotoPath) {
      facePhotoB64 = readFileToBase64(persona.facePhotoPath);
    }

    return {
      hasFace: !!persona.facePhotoPath,
      facePhoto: facePhotoB64,
    };
  }

  async registerFace(documento: string, imageBase64: string) {
    const repo = await this.getPersonaRepo();
    const persona = await repo.findOne({ where: { documento } });
    if (!persona) throw new NotFoundException('Aprendiz no encontrado');

    const photoPath = saveBaseFace(persona.id_persona, imageBase64);

    const response: any = await firstValueFrom(
      this.http.post(`${FACE_SERVICE_URL}/register`, {
        image: imageBase64,
        user_id: persona.id_persona,
      }),
    );

    const data = response.data;
    if (!data.success) {
      throw new Error(data.error || 'Error al registrar rostro');
    }

    persona.facePhotoPath = photoPath;
    persona.faceEmbedding = JSON.stringify(data.embedding);
    await repo.save(persona);

    return { success: true, message: 'Rostro registrado correctamente' };
  }
}
