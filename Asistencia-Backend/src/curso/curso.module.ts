// curso.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CursoOrmEntity }          from './infrastructure/entities/curso.orm-entity';
import { CursoTypeOrmRepository }  from './infrastructure/adapters/curso.typeorm.repository';
import { CursoService }            from './application/curso.service';
import { CursoController }         from './infrastructure/http/curso.controller';
import { CURSO_REPOSITORY }        from './domain/ports/curso.repository.port';
import { TenantModule }            from 'src/auth/infrastructure/persistence/tenants/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CursoOrmEntity]),
    TenantModule,
  ],
  controllers: [CursoController],
  providers: [
    CursoService,
    {
      provide: CURSO_REPOSITORY,
      useClass: CursoTypeOrmRepository,
    },
  ],
})
export class CursoModule {}