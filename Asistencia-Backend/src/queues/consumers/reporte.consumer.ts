import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job }                from 'bull';

@Processor('reportes')
@Injectable()
export class ReporteConsumer {
  private readonly logger = new Logger(ReporteConsumer.name);

  @Process('generar-asistencia')
  async handleGenerarAsistencia(job: Job<{
    formacion_fk:  string;
    solicitadoPor: string;
  }>) {
    this.logger.log(`Generando reporte formacion=${job.data.formacion_fk}`);
    // aquí irá la lógica de Excel/PDF cuando lo implementemos
    this.logger.log(`Reporte job#${job.id} completado`);
  }
}