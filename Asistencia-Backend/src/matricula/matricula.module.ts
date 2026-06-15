// matricula.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatriculaOrmEntity }         from './infrastructure/entities/matricula.orm-entity';
import { MatriculaTypeOrmRepository } from './infrastructure/adapters/matricula.typeorm.repository';
import { MatriculaService }           from './application/matricula.service';
import { MatriculaController }        from './infrastructure/http/matricula.controller';
import { MATRICULA_REPOSITORY }       from './domain/ports/matricula.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([MatriculaOrmEntity])],
  controllers: [MatriculaController],
  providers: [
    MatriculaService,
    {
      provide: MATRICULA_REPOSITORY,
      useClass: MatriculaTypeOrmRepository,
    },
  ],
})
export class MatriculaModule {}