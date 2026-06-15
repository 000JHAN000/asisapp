// sede.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SedeOrmEntity }          from './infrastructure/entities/sede.orm-entity';
import { SedeTypeOrmRepository }  from './infrastructure/adapters/sede.typeorm.repository';
import { SedeService }            from './application/sede.service';
import { SedeController }         from './infrastructure/http/sede.controller';
import { SEDE_REPOSITORY }        from './domain/ports/sede.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([SedeOrmEntity])],
  controllers: [SedeController],
  providers: [
    SedeService,
    {
      provide: SEDE_REPOSITORY,
      useClass: SedeTypeOrmRepository,
    },
  ],
})
export class SedeModule {}