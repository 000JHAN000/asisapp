// centro-formacion.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentroFormacionOrmEntity }         from './infrastructure/entities/centro-formacion.orm-entity';
import { CentroFormacionTypeOrmRepository } from './infrastructure/adapters/centro-formacion.typeorm.repository';
import { CentroFormacionService }           from './application/centro-formacion.service';
import { CentroFormacionController }        from './infrastructure/http/centro-formacion.controller';
import { CENTRO_FORMACION_REPOSITORY }      from './domain/ports/centro-formacion.repository.port';

@Module({
    imports: [TypeOrmModule.forFeature([CentroFormacionOrmEntity])],
    controllers: [CentroFormacionController],
    providers: [
    CentroFormacionService,
    {
        provide: CENTRO_FORMACION_REPOSITORY,
        useClass: CentroFormacionTypeOrmRepository,
    },
    ],
})
export class CentroFormacionModule {}