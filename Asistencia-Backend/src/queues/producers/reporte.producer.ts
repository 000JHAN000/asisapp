import { InjectQueue } from '@nestjs/bull';
import { Injectable }  from '@nestjs/common';
import type { Queue }       from 'bull';

@Injectable()
export class ReporteProducer {
  constructor(
    @InjectQueue('reportes')
    private readonly queue: Queue,
  ) {}

  async generarReporteAsistencia(datos: {
    formacion_fk: string;
    solicitadoPor: string; // usuario_fk
  }) {
    await this.queue.add('generar-asistencia', datos, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
    });
  }
}