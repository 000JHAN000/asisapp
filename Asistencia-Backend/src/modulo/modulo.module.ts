// modulo.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuloOrmEntity }         from './infrastructure/entities/modulo.orm-entity';
import { ModuloTypeOrmRepository } from './infrastructure/adapters/modulo.typeorm.repository';
import { ModuloService }           from './application/modulo.service';
import { ModuloController }        from './infrastructure/http/modulo.controller';
import { MODULO_REPOSITORY }       from './domain/ports/modulo.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([ModuloOrmEntity])],
  controllers: [ModuloController],
  providers: [
    ModuloService,
    {
      provide: MODULO_REPOSITORY,
      useClass: ModuloTypeOrmRepository,
    },
  ],
})
export class ModuloModule {}