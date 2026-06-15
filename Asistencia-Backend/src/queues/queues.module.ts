import { Module, forwardRef } from '@nestjs/common';
import { BullModule }         from '@nestjs/bull';
import { AsistenciaModule }   from 'src/asistencia/asistencia.module';

import { AsistenciaProducer } from './producers/asistencia.producer';
import { ReporteProducer }    from './producers/reporte.producer';
import { AsistenciaConsumer } from './consumers/asistencia.consumer';
import { ReporteConsumer }    from './consumers/reporte.consumer';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'asistencia' },
      { name: 'reportes'   },
    ),
    forwardRef(() => AsistenciaModule),
  ],
  providers: [
    AsistenciaProducer,
    ReporteProducer,
    AsistenciaConsumer,
    ReporteConsumer,
  ],
  exports: [
    BullModule,        
    AsistenciaProducer,
    ReporteProducer,
  ],
})
export class QueuesModule {}