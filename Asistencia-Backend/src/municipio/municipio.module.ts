// municipio.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MunicipioOrmEntity }          from './infrastructure/entities/municipio.orm-entity';
import { MunicipioTypeOrmRepository }  from './infrastructure/adapters/municipio.typeorm.repository';
import { MunicipioService }            from './application/municipio.service';
import { MunicipioController }         from './infrastructure/http/municipio.controller';
import { MUNICIPIO_REPOSITORY }        from './domain/ports/municipio.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([MunicipioOrmEntity])],
  controllers: [MunicipioController],
  providers: [
    MunicipioService,
    {
      provide: MUNICIPIO_REPOSITORY,
      useClass: MunicipioTypeOrmRepository,
    },
  ],
})
export class MunicipioModule {}