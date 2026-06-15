// acceso.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccesoOrmEntity }         from './infrastructure/entities/acceso.orm-entity';
import { AccesoTypeOrmRepository } from './infrastructure/adapters/acceso.typeorm.repository';
import { AccesoService }           from './application/acceso.service';
import { AccesoController }        from './infrastructure/http/acceso.controller';
import { ACCESO_REPOSITORY }       from './domain/ports/acceso.repository.port';


@Module({
  imports: [TypeOrmModule.forFeature([AccesoOrmEntity])],
  controllers: [AccesoController],
  providers: [
    AccesoService,
    {
      provide: ACCESO_REPOSITORY,
      useClass: AccesoTypeOrmRepository,
    },
  ],
})
export class AccesoModule {}