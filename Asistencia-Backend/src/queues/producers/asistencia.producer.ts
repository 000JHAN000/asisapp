import { InjectQueue } from '@nestjs/bull';
import { Injectable }  from '@nestjs/common';
import type { Queue }       from 'bull';
import { CreateAsistenciaDto } from 'src/asistencia/infrastructure/http/dto/create-asistencia.dto';

@Injectable()
export class AsistenciaProducer {
  constructor(
    @InjectQueue('asistencia')
    private readonly queue: Queue,
  ) {}

  async registrar(datos: CreateAsistenciaDto) {
    await this.queue.add('registrar', datos, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}