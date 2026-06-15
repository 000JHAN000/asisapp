// departamento.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartamentoOrmEntity }          from './infrastructure/entities/departamento.orm-entity';
import { DepartamentoTypeOrmRepository }  from './infrastructure/adapters/departamento.typeorm.repository';
import { DepartamentoService }            from './application/departamento.service';
import { DepartamentoController }         from './infrastructure/http/departamento.controller';
import { DEPARTAMENTO_REPOSITORY }        from './domain/ports/departamento.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([DepartamentoOrmEntity])
  ],
  controllers: [DepartamentoController],
  providers: [
    DepartamentoService,
    {
      provide: DEPARTAMENTO_REPOSITORY,
      useClass: DepartamentoTypeOrmRepository,
    },
  ],
})
export class DepartamentoModule {}