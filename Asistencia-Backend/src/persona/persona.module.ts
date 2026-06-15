// persona.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonaOrmEntity }         from './infrastructure/entities/persona.orm-entity';
import { PersonaTypeOrmRepository } from './infrastructure/adapters/persona.typeorm.repository';
import { PersonaService }           from './application/persona.service';
import { PersonaController }        from './infrastructure/http/persona.controller';
import { PERSONA_REPOSITORY }       from './domain/ports/persona.repository.port';

@Module({
    imports: [TypeOrmModule.forFeature([PersonaOrmEntity])],
    controllers: [PersonaController],
    providers: [
    PersonaService,
    {
        provide: PERSONA_REPOSITORY,
        useClass: PersonaTypeOrmRepository,
    },
],
})
export class PersonaModule {}