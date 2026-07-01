// modulo.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuloOrmEntity }         from './infrastructure/entities/modulo.orm-entity';
import { CompetenciaOrmEntity }             from './infrastructure/entities/competencia.orm-entity';
import { ModuloTypeOrmRepository } from './infrastructure/adapters/modulo.typeorm.repository';
import { ModuloService }           from './application/modulo.service';
import { CompetenciasCGService }   from './application/competencias-cg.service';
import { ModuloController }        from './infrastructure/http/modulo.controller';
import { CompetenciasCGController } from './infrastructure/http/competencias-cg.controller';
import { MODULO_REPOSITORY }       from './domain/ports/modulo.repository.port';
import { TenantModule }            from 'src/auth/infrastructure/persistence/tenants/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModuloOrmEntity, CompetenciaOrmEntity]),
    TenantModule,
  ],
  controllers: [ModuloController, CompetenciasCGController],
  providers: [
    ModuloService,
    CompetenciasCGService,
    {
      provide: MODULO_REPOSITORY,
      useClass: ModuloTypeOrmRepository,
    },
  ],
})
export class ModuloModule {}