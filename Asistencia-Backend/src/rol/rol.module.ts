// rol.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolOrmEntity }          from './infrastructure/entities/rol.orm-entity';
import { RolTypeOrmRepository }  from './infrastructure/adapters/rol.typeorm.repository';
import { RolService }            from './application/rol.service';
import { RolController }         from './infrastructure/http/rol.controller';
import { ROL_REPOSITORY }        from './domain/ports/rol.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([RolOrmEntity])
  ],
  controllers: [RolController],
  providers: [
    RolService,
    {
      provide: ROL_REPOSITORY,
      useClass: RolTypeOrmRepository,
    },
  ],
})
export class RolModule {}