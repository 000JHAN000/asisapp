// servicio.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicioOrmEntity }         from './infrastructure/entities/servicio.orm-entity';
import { ServicioTypeOrmRepository } from './infrastructure/adapters/servicio.typeorm.repository';
import { ServicioService }           from './application/servicio.service';
import { ServicioController }        from './infrastructure/http/servicio.controller';
import { SERVICIO_REPOSITORY }       from './domain/ports/servicio.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServicioOrmEntity])
  ],
  controllers: [ServicioController],
  providers: [
    ServicioService,
    {
      provide: SERVICIO_REPOSITORY,
      useClass: ServicioTypeOrmRepository,
    },
  ],
})
export class ServicioModule {}