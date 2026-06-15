import { Processor, Process } from '@nestjs/bull';
import { Logger }             from '@nestjs/common';
import type { Job }                from 'bull';
import { AsistenciaService }  from 'src/asistencia/application/asistencia.service';
import { CreateAsistenciaDto } from 'src/asistencia/infrastructure/http/dto/create-asistencia.dto';

@Processor('asistencia')
export class AsistenciaConsumer {
  private readonly logger = new Logger(AsistenciaConsumer.name);

  constructor(
    private readonly asistenciaService: AsistenciaService,
  ) {}

  @Process('registrar')
  async handleRegistrar(job: Job<CreateAsistenciaDto>) {
    this.logger.log(`Procesando asistencia job#${job.id}`);
    await this.asistenciaService.create(job.data);
    this.logger.log(`Asistencia job#${job.id} completada`);
  }
}