import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorarioOrmEntity }         from './infrastructure/entities/horario.orm-entity';

import { HorarioTypeOrmRepository } from './infrastructure/adapters/horario.typeorm.repository';
import { HorarioService }           from './application/horario.service';
import { HorariosCGService }        from './application/horarios-cg.service';
import { HorariosAdminCGService }   from './application/horarios-admin-cg.service';
import { HorarioController }        from './infrastructure/http/horario.controller';
import { HorariosCGController }     from './infrastructure/http/horarios-cg.controller';
import { HorariosAdminCGController } from './infrastructure/http/horarios-admin-cg.controller';
import { HORARIO_REPOSITORY }       from './domain/ports/horario.repository.port';
import { TenantModule }             from 'src/auth/infrastructure/persistence/tenants/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HorarioOrmEntity]),
    TenantModule,
  ],
  controllers: [HorarioController, HorariosCGController, HorariosAdminCGController],
  providers: [
    HorarioService,
    HorariosCGService,
    HorariosAdminCGService,
    {
      provide: HORARIO_REPOSITORY,
      useClass: HorarioTypeOrmRepository,
    },
  ],
})
export class HorarioModule {}