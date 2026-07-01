import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { AsistenciaOrmEntity } from './infrastructure/entities/asistencia.orm-entity';
import { FormacionAsistenciaOrmEntity } from './infrastructure/entities/formacion-asistencia.orm-entity';
import { ConfiguracionAsistenciaOrmEntity } from './infrastructure/entities/configuracion-asistencia.orm-entity';
import { AsistenciaSesionOrmEntity } from './infrastructure/entities/asistencia-sesion.orm-entity';
import { AsistenciaRegistroOrmEntity } from './infrastructure/entities/asistencia-registro.orm-entity';

import { AsistenciaTypeOrmRepository } from './infrastructure/adapters/asistencia.typeorm.repository';
import { FormacionAsistenciaTypeOrmRepository } from './infrastructure/adapters/formacion-asistencia.typeorm.repository';
import { ConfiguracionAsistenciaTypeOrmRepository } from './infrastructure/adapters/configuracion-asistencia.typeorm.repository';

import { AsistenciaService } from './application/asistencia.service';
import { FormacionAsistenciaService } from './application/formacion-asistencia.service';
import { ConfiguracionAsistenciaService } from './application/configuracion-asistencia.service';
import { AsistenciaSesionService } from './application/asistencia-sesion.service';
import { AsistenciaRegistroService } from './application/asistencia-registro.service';

import { AsistenciaController } from './infrastructure/http/asistencia.controller';
import { FormacionAsistenciaController } from './infrastructure/http/formacion-asistencia.controller';
import { ConfiguracionAsistenciaController } from './infrastructure/http/configuracion-asistencia.controller';
import { AsistenciaSesionController } from './infrastructure/http/asistencia-sesion.controller';
import { AsistenciaRegistroController } from './infrastructure/http/asistencia-registro.controller';

import { ASISTENCIA_REPOSITORY } from './domain/ports/asistencia.repository.port';
import { FORMACION_ASISTENCIA_REPOSITORY } from './domain/ports/formacion-asistencia.repository.port';
import { CONFIGURACION_ASISTENCIA_REPOSITORY } from './domain/ports/configuracion-asistencia.repository.port';


import { QueuesModule } from 'src/queues/queues.module';
import { TenantModule } from 'src/auth/infrastructure/persistence/tenants/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AsistenciaOrmEntity,
      FormacionAsistenciaOrmEntity,
      ConfiguracionAsistenciaOrmEntity,
      AsistenciaSesionOrmEntity,
      AsistenciaRegistroOrmEntity,
    ]),
    HttpModule,
    TenantModule,
    forwardRef(() => QueuesModule),
  ],
  controllers: [
    AsistenciaSesionController,
    AsistenciaRegistroController,
    AsistenciaController,
    FormacionAsistenciaController,
    ConfiguracionAsistenciaController,
  ],
  providers: [
    AsistenciaService,
    FormacionAsistenciaService,
    ConfiguracionAsistenciaService,
    AsistenciaSesionService,
    AsistenciaRegistroService,
    {
      provide: ASISTENCIA_REPOSITORY,
      useClass: AsistenciaTypeOrmRepository,
    },
    {
      provide: FORMACION_ASISTENCIA_REPOSITORY,
      useClass: FormacionAsistenciaTypeOrmRepository,
    },
    {
      provide: CONFIGURACION_ASISTENCIA_REPOSITORY,
      useClass: ConfiguracionAsistenciaTypeOrmRepository,
    },
  ],
  exports: [AsistenciaService],
})
export class AsistenciaModule {}
