import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AprendizCG } from '../entities/aprendiz-cg.entity';
import { saveBaseFace, getBaseFacePath, readFileToBase64 } from '../utils/file-storage.util';

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5000';

@Injectable()
export class AprendicesService {
  constructor(
    @InjectRepository(AprendizCG)
    private readonly repo: Repository<AprendizCG>,
    private readonly http: HttpService,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async update(id: string, data: any) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async getFaceStatus(documento: string) {
    const aprendiz = await this.repo.findOne({ where: { documento } });
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
    const aprendiz = await this.repo.findOne({ where: { documento } });
    if (!aprendiz) throw new NotFoundException('Aprendiz no encontrado');

    // Guardar foto base en disco del backend
    const photoPath = saveBaseFace(aprendiz.id, imageBase64);

    // Llamar al servicio Python para registrar el rostro y extraer embedding
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

    // Guardar en la base de datos
    aprendiz.facePhotoPath = photoPath;
    aprendiz.faceEmbedding = JSON.stringify(data.embedding);
    await this.repo.save(aprendiz);

    return { success: true, message: 'Rostro registrado correctamente' };
  }
}
