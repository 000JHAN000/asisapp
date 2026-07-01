// persona.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PersonaOrmEntity }         from './infrastructure/entities/persona.orm-entity';
import { AdministradorOrmEntity }   from './infrastructure/entities/administrador.orm-entity';
import { UsuarioMaestro }           from 'src/auth/infrastructure/entities/usuario-maestro.orm-entity';
import { PersonaTypeOrmRepository } from './infrastructure/adapters/persona.typeorm.repository';
import { PersonaService }           from './application/persona.service';
import { InstructoresCGService }    from './application/instructores-cg.service';
import { AprendicesCGService }      from './application/aprendices-cg.service';
import { AdministradoresCGService } from './application/administradores-cg.service';
import { PersonaController }        from './infrastructure/http/persona.controller';
import { InstructoresCGController } from './infrastructure/http/instructores-cg.controller';
import { AprendicesCGController }   from './infrastructure/http/aprendices-cg.controller';
import { AdministradoresCGController } from './infrastructure/http/administradores-cg.controller';
import { PERSONA_REPOSITORY }       from './domain/ports/persona.repository.port';
import { TenantModule }             from 'src/auth/infrastructure/persistence/tenants/tenant.module';

import { InstructorOrmEntity } from './infrastructure/entities/instructor.orm-entity';

@Module({
    imports: [
      TypeOrmModule.forFeature([
        PersonaOrmEntity,
        InstructorOrmEntity,
        AdministradorOrmEntity,
        UsuarioMaestro
      ]),
      TenantModule,
      HttpModule,
    ],
    controllers: [
      PersonaController,
      InstructoresCGController,
      AprendicesCGController,
      AdministradoresCGController,
    ],
    providers: [
    PersonaService,
    InstructoresCGService,
    AprendicesCGService,
    AdministradoresCGService,
    {
        provide: PERSONA_REPOSITORY,
        useClass: PersonaTypeOrmRepository,
    },
],
})
export class PersonaModule {}