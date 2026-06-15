// area.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaOrmEntity }          from './infrastructure/entities/area.orm-entity';
import { AreaTypeOrmRepository }  from './infrastructure/adapters/area.typeorm.repository';
import { AreaService }            from './application/area.service';
import { AreaController }         from './infrastructure/http/area.controller';
import { AREA_REPOSITORY }        from './domain/ports/area.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([AreaOrmEntity])],
  controllers: [AreaController],
  providers: [
    AreaService,
    {
      provide: AREA_REPOSITORY,
      useClass: AreaTypeOrmRepository,
    },
  ],
})
export class AreaModule {}