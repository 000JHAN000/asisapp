// permiso.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermisoOrmEntity }         from './infrastructure/entities/permiso.orm-entity';
import { PermisoTypeOrmRepository } from './infrastructure/adapters/permiso.typeorm.repository';
import { PermisoService }           from './application/permiso.service';
import { PermisoController }        from './infrastructure/http/permiso.controller';
import { PERMISO_REPOSITORY }       from './domain/ports/permiso.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([PermisoOrmEntity])],
  controllers: [PermisoController],
  providers: [
    PermisoService,
    {
      provide: PERMISO_REPOSITORY,
      useClass: PermisoTypeOrmRepository,
    },
  ],
})
export class PermisoModule {}