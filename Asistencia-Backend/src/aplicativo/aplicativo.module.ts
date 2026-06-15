// aplicativo.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AplicativoOrmEntity }         from './infrastructure/entities/aplicativo.orm-entity';
import { AplicativoTypeOrmRepository } from './infrastructure/adapters/aplicativo.typeorm.repository';
import { AplicativoService }           from './application/aplicativo.service';
import { AplicativoController }        from './infrastructure/http/aplicativo.controller';
import { APLICATIVO_REPOSITORY }       from './domain/ports/aplicativo.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([AplicativoOrmEntity])],
  controllers: [AplicativoController],
  providers: [
    AplicativoService,
    {
      provide: APLICATIVO_REPOSITORY,
      useClass: AplicativoTypeOrmRepository,
    },
  ],
})
export class AplicativoModule {}