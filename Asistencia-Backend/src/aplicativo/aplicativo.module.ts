// aplicativo.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AplicativoOrmEntity }         from './infrastructure/entities/aplicativo.orm-entity';
import { EventoOrmEntity }                      from './infrastructure/entities/evento.orm-entity';
import { SolicitudCambioOrmEntity }             from './infrastructure/entities/solicitud-cambio.orm-entity';
import { NotificacionOrmEntity }                from './infrastructure/entities/notificacion.orm-entity';
import { ConfiguracionAppOrmEntity }            from './infrastructure/entities/configuracion-app.orm-entity';
import { CentroFormacionOrmEntity }    from 'src/centro-formacion/infrastructure/entities/centro-formacion.orm-entity';
import { SedeOrmEntity }               from 'src/sede/infrastructure/entities/sede.orm-entity';
import { DepartamentoOrmEntity }       from 'src/departamento/infrastructure/entities/departamento.orm-entity';
import { MunicipioOrmEntity }          from 'src/municipio/infrastructure/entities/municipio.orm-entity';
import { AreaOrmEntity }               from 'src/area/infrastructure/entities/area.orm-entity';
import { ProgramaOrmEntity }           from 'src/programa/infrastructure/entities/programa.orm-entity';
import { PersonaOrmEntity }            from 'src/persona/infrastructure/entities/persona.orm-entity';
import { CursoOrmEntity }              from 'src/curso/infrastructure/entities/curso.orm-entity';
import { MatriculaOrmEntity }          from 'src/matricula/infrastructure/entities/matricula.orm-entity';
import { ModuloOrmEntity }             from 'src/modulo/infrastructure/entities/modulo.orm-entity';
import { ServicioOrmEntity }           from 'src/servicio/infrastructure/entities/servicio.orm-entity';
import { UsuarioOrmEntity }            from 'src/usuario/infrastructure/entities/usuario.orm-entity';
import { CredencialOrmEntity }         from 'src/credencial/infrastructure/entities/credencial.orm-entity';
import { PermisoOrmEntity }            from 'src/permiso/infrastructure/entities/permiso.orm-entity';
import { AccesoOrmEntity }             from 'src/acceso/infrastructure/entities/acceso.orm-entity';
import { RolOrmEntity }                from 'src/rol/infrastructure/entities/rol.orm-entity';
import { AmbienteOrmEntity }           from 'src/ambiente/infrastructure/entities/ambiente.orm-entity';
import { AplicativoTypeOrmRepository } from './infrastructure/adapters/aplicativo.typeorm.repository';
import { AplicativoService }           from './application/aplicativo.service';
import { EventosCGService }            from './application/eventos-cg.service';
import { SolicitudesCGService }        from './application/solicitudes-cg.service';
import { NotificacionesCGService }     from './application/notificaciones-cg.service';
import { ConfiguracionCGService }      from './application/configuracion-cg.service';
import { FormativoCGService }          from './application/formativo-cg.service';
import { AplicativoController }        from './infrastructure/http/aplicativo.controller';
import { EventosCGController }         from './infrastructure/http/eventos-cg.controller';
import { SolicitudesCGController }     from './infrastructure/http/solicitudes-cg.controller';
import { NotificacionesCGController }  from './infrastructure/http/notificaciones-cg.controller';
import { ConfiguracionCGController }   from './infrastructure/http/configuracion-cg.controller';
import { UploadCGController }          from './infrastructure/http/upload-cg.controller';
import { FormativoCGController }       from './infrastructure/http/formativo-cg.controller';
import { APLICATIVO_REPOSITORY }       from './domain/ports/aplicativo.repository.port';
import { TenantModule }                from 'src/auth/infrastructure/persistence/tenants/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AplicativoOrmEntity,
      EventoOrmEntity,
      SolicitudCambioOrmEntity,
      NotificacionOrmEntity,
      ConfiguracionAppOrmEntity,
      CentroFormacionOrmEntity,
      SedeOrmEntity,
      DepartamentoOrmEntity,
      MunicipioOrmEntity,
      AreaOrmEntity,
      ProgramaOrmEntity,
      PersonaOrmEntity,
      CursoOrmEntity,
      MatriculaOrmEntity,
      ModuloOrmEntity,
      ServicioOrmEntity,
      UsuarioOrmEntity,
      CredencialOrmEntity,
      PermisoOrmEntity,
      AccesoOrmEntity,
      RolOrmEntity,
      AmbienteOrmEntity,
    ]),
    TenantModule,
  ],
  controllers: [
    AplicativoController,
    EventosCGController,
    SolicitudesCGController,
    NotificacionesCGController,
    ConfiguracionCGController,
    UploadCGController,
    FormativoCGController,
  ],
  providers: [
    AplicativoService,
    EventosCGService,
    SolicitudesCGService,
    NotificacionesCGService,
    ConfiguracionCGService,
    FormativoCGService,
    {
      provide: APLICATIVO_REPOSITORY,
      useClass: AplicativoTypeOrmRepository,
    },
  ],
})
export class AplicativoModule {}