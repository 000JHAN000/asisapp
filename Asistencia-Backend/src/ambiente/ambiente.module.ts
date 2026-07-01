// ambiente.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmbienteOrmEntity }          from './infrastructure/entities/ambiente.orm-entity';
import { AmbienteCG }                 from './infrastructure/entities/ambiente-cg.orm-entity';
import { AmbienteTypeOrmRepository }  from './infrastructure/adapters/ambiente.typeorm.repository';
import { AmbienteService }            from './application/ambiente.service';
import { AmbientesCGService }         from './application/ambientes-cg.service';
import { AmbienteController }         from './infrastructure/http/ambiente.controller';
import { AmbientesCGController }      from './infrastructure/http/ambientes-cg.controller';
import { AMBIENTE_REPOSITORY }        from './domain/ports/ambiente.repository.port';
import { TenantModule }               from 'src/auth/infrastructure/persistence/tenants/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AmbienteOrmEntity, AmbienteCG]),
    TenantModule,
  ],
  controllers: [AmbienteController, AmbientesCGController],
  providers: [
    AmbienteService,
    AmbientesCGService,
    {
      provide: AMBIENTE_REPOSITORY,
      useClass: AmbienteTypeOrmRepository,
    },
  ],
})
export class AmbienteModule {}