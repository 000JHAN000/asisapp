// usuario.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioOrmEntity }         from './infrastructure/entities/usuario.orm-entity';
import { PersonaOrmEntity }         from 'src/persona/infrastructure/entities/persona.orm-entity';
import { UsuarioTypeOrmRepository } from './infrastructure/adapters/usuario.typeorm.repository';
import { UsuarioService }           from './application/usuario.service';
import { UsuariosCGService }        from './application/usuarios-cg.service';
import { UsuarioController }        from './infrastructure/http/usuario.controller';
import { UsuariosCGController }     from './infrastructure/http/usuarios-cg.controller';
import { USUARIO_REPOSITORY }       from './domain/ports/usuario.repository.port';
import { TenantModule }             from 'src/auth/infrastructure/persistence/tenants/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioOrmEntity, PersonaOrmEntity]),
    TenantModule,
  ],
  controllers: [UsuarioController, UsuariosCGController],
  providers: [
    UsuarioService,
    UsuariosCGService,
    {
      provide: USUARIO_REPOSITORY,
      useClass: UsuarioTypeOrmRepository,
    },
  ],
  exports: [UsuariosCGService],
})
export class UsuarioModule {}