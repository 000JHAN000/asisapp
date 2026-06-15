// programa.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramaOrmEntity }          from './infrastructure/entities/programa.orm-entity';
import { ProgramaTypeOrmRepository }  from './infrastructure/adapters/programa.typeorm.repository';
import { ProgramaService }            from './application/programa.service';
import { ProgramaController }         from './infrastructure/http/programa.controller';
import { PROGRAMA_REPOSITORY }        from './domain/ports/programa.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramaOrmEntity])],
  controllers: [ProgramaController],
  providers: [
    ProgramaService,
    {
      provide: PROGRAMA_REPOSITORY,
      useClass: ProgramaTypeOrmRepository,
    },
  ],
})
export class ProgramaModule {}