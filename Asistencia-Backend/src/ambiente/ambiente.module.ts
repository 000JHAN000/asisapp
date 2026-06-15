// ambiente.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmbienteOrmEntity }          from './infrastructure/entities/ambiente.orm-entity';
import { AmbienteTypeOrmRepository }  from './infrastructure/adapters/ambiente.typeorm.repository';
import { AmbienteService }            from './application/ambiente.service';
import { AmbienteController }         from './infrastructure/http/ambiente.controller';
import { AMBIENTE_REPOSITORY }        from './domain/ports/ambiente.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([AmbienteOrmEntity])],
  controllers: [AmbienteController],
  providers: [
    AmbienteService,
    {
      provide: AMBIENTE_REPOSITORY,
      useClass: AmbienteTypeOrmRepository,
    },
  ],
})
export class AmbienteModule {}