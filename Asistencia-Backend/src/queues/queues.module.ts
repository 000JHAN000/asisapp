import { Module } from '@nestjs/common';
import { BullModule }         from '@nestjs/bull';

import { ReporteProducer }    from './producers/reporte.producer';
import { ReporteConsumer }    from './consumers/reporte.consumer';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'reportes' },
    ),
  ],
  providers: [
    ReporteProducer,
    ReporteConsumer,
  ],
  exports: [
    BullModule,
    ReporteProducer,
  ],
})
export class QueuesModule {}