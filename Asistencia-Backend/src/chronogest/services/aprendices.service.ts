import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AprendizCG } from '../entities/aprendiz-cg.entity';
import { UsuarioCG } from '../entities/usuario-cg.entity';
import { saveBaseFace, getBaseFacePath, readFileToBase64 } from '../utils/file-storage.util';
import { TenantConnectionManager } from '../../infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5000';

@Injectable()
export class AprendicesService {
  constructor(
    @InjectRepository(UsuarioCG)
    private readonly usuarioRepo: Repository<UsuarioCG>,
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

  private async getRepo() {
    return this.connectionManager.getTenantRepository(this.tenantId, AprendizCG);
  }

  private async enrichWithTenant(list: AprendizCG[]) {
    const documentos = list.map(a => a.documento);
    const usuarios = documentos.length
      ? await this.usuarioRepo.find({ where: { documento: In(documentos) } })
      : [];
    const map = new Map(usuarios.map(u => [u.documento, u]));
    return Promise.all(list.map(async a => {
      const u = map.get(a.documento);
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
        ...a,
        tenantSlug: u?.tenantSlug ?? null,
        tenantNombre,
      };
    }));
  }

  async findAll() {
    const repo = await this.getRepo();
    const list = await repo.find();
    return this.enrichWithTenant(list);
  }

  async update(id: string, data: any) {
    const repo = await this.getRepo();
    await repo.update(id, data);
    return repo.findOne({ where: { id } });
  }

  async getFaceStatus(documento: string) {
    const repo = await this.getRepo();
    const aprendiz = await repo.findOne({ where: { documento } });
    if (!aprendiz) throw new NotFoundException('Aprendiz no encontrado');

    let facePhotoB64: string | null = null;
    if (aprendiz.facePhotoPath) {
      facePhotoB64 = readFileToBase64(aprendiz.facePhotoPath);
    }

    return {
      hasFace: !!aprendiz.facePhotoPath,
      facePhoto: facePhotoB64,
    };
  }

  async registerFace(documento: string, imageBase64: string) {
    const repo = await this.getRepo();
    const aprendiz = await repo.findOne({ where: { documento } });
    if (!aprendiz) throw new NotFoundException('Aprendiz no encontrado');

    const photoPath = saveBaseFace(aprendiz.id, imageBase64);

    const response: any = await firstValueFrom(
      this.http.post(`${FACE_SERVICE_URL}/register`, {
        image: imageBase64,
        user_id: aprendiz.id,
      }),
    );

    const data = response.data;
    if (!data.success) {
      throw new Error(data.error || 'Error al registrar rostro');
    }

    aprendiz.facePhotoPath = photoPath;
    aprendiz.faceEmbedding = JSON.stringify(data.embedding);
    await repo.save(aprendiz);

    return { success: true, message: 'Rostro registrado correctamente' };
  }
}
