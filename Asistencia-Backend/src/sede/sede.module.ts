// sede.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SedeOrmEntity }          from './infrastructure/entities/sede.orm-entity';
import { UbicacionOrmEntity }              from './infrastructure/entities/ubicacion.orm-entity';
import { SedeTypeOrmRepository }  from './infrastructure/adapters/sede.typeorm.repository';
import { SedeService }            from './application/sede.service';
import { UbicacionesCGService }   from './application/ubicaciones-cg.service';
import { SedeController }         from './infrastructure/http/sede.controller';
import { UbicacionesCGController } from './infrastructure/http/ubicaciones-cg.controller';
import { SEDE_REPOSITORY }        from './domain/ports/sede.repository.port';
import { TenantModule }           from 'src/auth/infrastructure/persistence/tenants/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SedeOrmEntity, UbicacionOrmEntity]),
    TenantModule,
  ],
  controllers: [SedeController, UbicacionesCGController],
  providers: [
    SedeService,
    UbicacionesCGService,
    {
      provide: SEDE_REPOSITORY,
      useClass: SedeTypeOrmRepository,
    },
  ],
})
export class SedeModule {}