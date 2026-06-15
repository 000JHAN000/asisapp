// usuario.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioOrmEntity }         from './infrastructure/entities/usuario.orm-entity';
import { UsuarioTypeOrmRepository } from './infrastructure/adapters/usuario.typeorm.repository';
import { UsuarioService }           from './application/usuario.service';
import { UsuarioController }        from './infrastructure/http/usuario.controller';
import { USUARIO_REPOSITORY }       from './domain/ports/usuario.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioOrmEntity])
  ],
  controllers: [UsuarioController],
  providers: [
    UsuarioService,
    {
      provide: USUARIO_REPOSITORY,
      useClass: UsuarioTypeOrmRepository,
    },
  ],
})
export class UsuarioModule {}