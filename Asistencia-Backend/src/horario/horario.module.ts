import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorarioOrmEntity }         from './infrastructure/entities/horario.orm-entity';
import { HorarioTypeOrmRepository } from './infrastructure/adapters/horario.typeorm.repository';
import { HorarioService }           from './application/horario.service';
import { HorarioController }        from './infrastructure/http/horario.controller';
import { HORARIO_REPOSITORY }       from './domain/ports/horario.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([HorarioOrmEntity])],
  controllers: [HorarioController],
  providers: [
    HorarioService,
    {
      provide: HORARIO_REPOSITORY,
      useClass: HorarioTypeOrmRepository,
    },
  ],
})
export class HorarioModule {}