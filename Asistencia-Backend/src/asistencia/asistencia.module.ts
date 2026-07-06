import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { AsistenciaSesionService } from './application/asistencia-sesion.service';
import { AsistenciaRegistroService } from './application/asistencia-registro.service';

import { AsistenciaSesionController } from './infrastructure/http/asistencia-sesion.controller';
import { AsistenciaRegistroController } from './infrastructure/http/asistencia-registro.controller';

import { ASISTENCIA_SESION_REPOSITORY } from './domain/ports/asistencia-sesion.repository.port';
import { ASISTENCIA_REGISTRO_REPOSITORY } from './domain/ports/asistencia-registro.repository.port';
import { AsistenciaSesionTypeOrmRepository } from './infrastructure/adapters/asistencia-sesion.typeorm.repository';
import { AsistenciaRegistroTypeOrmRepository } from './infrastructure/adapters/asistencia-registro.typeorm.repository';

import { TenantModule } from 'src/auth/infrastructure/persistence/tenants/tenant.module';

@Module({
  imports: [HttpModule, TenantModule],
  controllers: [
    AsistenciaSesionController,
    AsistenciaRegistroController,
  ],
  providers: [
    AsistenciaSesionService,
    AsistenciaRegistroService,
    { provide: ASISTENCIA_SESION_REPOSITORY, useClass: AsistenciaSesionTypeOrmRepository },
    { provide: ASISTENCIA_REGISTRO_REPOSITORY, useClass: AsistenciaRegistroTypeOrmRepository },
  ],
})
export class AsistenciaModule {}
