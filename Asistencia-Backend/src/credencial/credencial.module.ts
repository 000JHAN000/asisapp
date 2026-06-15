// credencial.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredencialOrmEntity }         from './infrastructure/entities/credencial.orm-entity';
import { CredencialTypeOrmRepository } from './infrastructure/adapters/credencial.typeorm.repository';
import { CredencialService }           from './application/credencial.service';
import { CredencialController }        from './infrastructure/http/credencial.controller';
import { CREDENCIAL_REPOSITORY }       from './domain/ports/credencial.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([CredencialOrmEntity])],
  controllers: [CredencialController],
  providers: [
    CredencialService,
    {
      provide: CREDENCIAL_REPOSITORY,
      useClass: CredencialTypeOrmRepository,
    },
  ],
})
export class CredencialModule {}