import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule }        from '@nestjs/bull';
import { CacheModule }       from '@nestjs/cache-manager';
import * as redisStore       from 'cache-manager-ioredis';
import { AuthModule }          from './auth/auth.module';
import { JwtGuard }            from './auth/infrastructure/guards/jwt.guard';
import { TenantGuard }         from './auth/infrastructure/guards/tenant.guard';
import { RbacGuard }           from './auth/infrastructure/guards/rbac.guard';
import { TenantMatchGuard }    from './auth/infrastructure/guards/tenant-match.guard';
import { RolOrmEntity }        from './rol/infrastructure/entities/rol.orm-entity';
import { DepartamentoModule }  from './departamento/departamento.module';
import { MunicipioModule }     from './municipio/municipio.module';
import { CentroFormacionModule } from './centro-formacion/centro-formacion.module';
import { SedeModule }          from './sede/sede.module';
import { AmbienteModule }      from './ambiente/ambiente.module';
import { AreaModule }          from './area/area.module';
import { ProgramaModule }      from './programa/programa.module';
import { CursoModule }         from './curso/curso.module';
import { MatriculaModule }     from './matricula/matricula.module';
import { PersonaModule }       from './persona/persona.module';
import { AplicativoModule }    from './aplicativo/aplicativo.module';
import { ModuloModule }        from './modulo/modulo.module';
import { ServicioModule }      from './servicio/servicio.module';
import { RolModule }           from './rol/rol.module';
import { PermisoModule }       from './permiso/permiso.module';
import { UsuarioModule }       from './usuario/usuario.module';
import { CredencialModule }    from './credencial/credencial.module';
import { AccesoModule }        from './acceso/acceso.module';
import { QueuesModule } from './queues/queues.module';
import { AsistenciaModule }    from './asistencia/asistencia.module';
import { HorarioModule }       from './horario/horario.module';
import { TenantModule }          from './auth/infrastructure/persistence/tenants/tenant.module';
import { TenantMiddleware }      from './infrastructure/middleware/tenant.middleware';
import { SuperAdminModule }      from './super-admin/super-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host:     config.get<string>('DB_HOST'),
        port:     config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports:  [ConfigModule],
      inject:   [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host:  config.get<string>('REDIS_HOST'),
        port:  config.get<number>('REDIS_PORT'),
        ttl:   60,
      }),
    }),

    BullModule.forRootAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),

    BullModule.registerQueue(
      { name: 'asistencia' },
      { name: 'reportes'   },
    ),

    TypeOrmModule.forFeature([RolOrmEntity]),
    AuthModule,
    DepartamentoModule,
    MunicipioModule,
    CentroFormacionModule,
    SedeModule,
    AmbienteModule,
    AreaModule,
    ProgramaModule,
    CursoModule,
    MatriculaModule,
    PersonaModule,
    AplicativoModule,
    ModuloModule,
    ServicioModule,
    RolModule,
    PermisoModule,
    UsuarioModule,
    CredencialModule,
    AccesoModule,
    AsistenciaModule,
    HorarioModule,
    QueuesModule,
    TenantModule,
    SuperAdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtGuard       },
    { provide: APP_GUARD, useClass: TenantMatchGuard },
    { provide: APP_GUARD, useClass: RbacGuard      },
    { provide: APP_GUARD, useClass: TenantGuard    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'tenants', method: RequestMethod.GET },
        { path: 'super-admin/auth/login', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}