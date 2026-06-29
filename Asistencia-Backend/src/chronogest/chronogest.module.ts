import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { TenantModule } from '../infrastructure/persistence/tenants/tenant.module';

import { UsuarioCG } from './entities/usuario-cg.entity';

import { CentroFormacionOrmEntity } from '../centro-formacion/infrastructure/entities/centro-formacion.orm-entity';
import { SedeOrmEntity } from '../sede/infrastructure/entities/sede.orm-entity';
import { DepartamentoOrmEntity } from '../departamento/infrastructure/entities/departamento.orm-entity';
import { MunicipioOrmEntity } from '../municipio/infrastructure/entities/municipio.orm-entity';
import { AreaOrmEntity } from '../area/infrastructure/entities/area.orm-entity';
import { ProgramaOrmEntity } from '../programa/infrastructure/entities/programa.orm-entity';
import { PersonaOrmEntity } from '../persona/infrastructure/entities/persona.orm-entity';
import { CursoOrmEntity } from '../curso/infrastructure/entities/curso.orm-entity';
import { MatriculaOrmEntity } from '../matricula/infrastructure/entities/matricula.orm-entity';
import { AplicativoOrmEntity } from '../aplicativo/infrastructure/entities/aplicativo.orm-entity';
import { ModuloOrmEntity } from '../modulo/infrastructure/entities/modulo.orm-entity';
import { ServicioOrmEntity } from '../servicio/infrastructure/entities/servicio.orm-entity';
import { UsuarioOrmEntity } from '../usuario/infrastructure/entities/usuario.orm-entity';
import { CredencialOrmEntity } from '../credencial/infrastructure/entities/credencial.orm-entity';
import { PermisoOrmEntity } from '../permiso/infrastructure/entities/permiso.orm-entity';
import { AccesoOrmEntity } from '../acceso/infrastructure/entities/acceso.orm-entity';
import { RolOrmEntity } from '../rol/infrastructure/entities/rol.orm-entity';
import { AmbienteOrmEntity } from '../ambiente/infrastructure/entities/ambiente.orm-entity';

import { AuthCGController } from './controllers/auth-cg.controller';
import { UsuariosCGController } from './controllers/usuarios-cg.controller';
import { FichasController } from './controllers/fichas.controller';
import { AmbientesController } from './controllers/ambientes.controller';
import { InstructoresController } from './controllers/instructores.controller';
import { AprendicesController } from './controllers/aprendices.controller';
import { AdministradoresController } from './controllers/administradores.controller';
import { HorariosController } from './controllers/horarios.controller';
import { CompetenciasController } from './controllers/competencias.controller';
import { EventosController } from './controllers/eventos.controller';
import { SolicitudesController } from './controllers/solicitudes.controller';
import { NotificacionesController } from './controllers/notificaciones.controller';
import { ConfiguracionController } from './controllers/configuracion.controller';
import { UbicacionesController } from './controllers/ubicaciones.controller';
import { UploadController } from './controllers/upload.controller';
import { FormativoController } from './controllers/formativo.controller';
import { HorariosAdminController } from './controllers/horarios-admin.controller';

import { AuthCGService } from './services/auth-cg.service';
import { UsuariosCGService } from './services/usuarios-cg.service';
import { FichasService } from './services/fichas.service';
import { AmbientesService } from './services/ambientes.service';
import { InstructoresService } from './services/instructores.service';
import { AprendicesService } from './services/aprendices.service';
import { AdministradoresService } from './services/administradores.service';
import { HorariosService } from './services/horarios.service';
import { CompetenciasService } from './services/competencias.service';
import { EventosService } from './services/eventos.service';
import { SolicitudesService } from './services/solicitudes.service';
import { NotificacionesService } from './services/notificaciones.service';
import { ConfiguracionService } from './services/configuracion.service';
import { UbicacionesService } from './services/ubicaciones.service';
import { FormativoService } from './services/formativo.service';
import { HorariosAdminService } from './services/horarios-admin.service';

@Module({
  imports: [
    JwtModule.register({}),
    HttpModule,
    TenantModule,
    TypeOrmModule.forFeature([
      // UsuarioCG vive en sena_db y se usa para autenticación/asignación de sede.
      UsuarioCG,
      // Entidades externas (legacy) requeridas por FormativoService.
      CentroFormacionOrmEntity, SedeOrmEntity, DepartamentoOrmEntity,
      MunicipioOrmEntity, AreaOrmEntity, ProgramaOrmEntity, PersonaOrmEntity,
      CursoOrmEntity, MatriculaOrmEntity, AplicativoOrmEntity, ModuloOrmEntity,
      ServicioOrmEntity, UsuarioOrmEntity, CredencialOrmEntity, PermisoOrmEntity,
      AccesoOrmEntity, RolOrmEntity, AmbienteOrmEntity,
    ]),
  ],
  controllers: [
    AuthCGController, UsuariosCGController, FichasController, AmbientesController,
    InstructoresController, AprendicesController, AdministradoresController,
    HorariosController, CompetenciasController, EventosController,
    SolicitudesController, NotificacionesController, ConfiguracionController,
    UbicacionesController, UploadController, FormativoController, HorariosAdminController,
  ],
  providers: [
    AuthCGService, UsuariosCGService, FichasService, AmbientesService,
    InstructoresService, AprendicesService, AdministradoresService,
    HorariosService, CompetenciasService, EventosService,
    SolicitudesService, NotificacionesService, ConfiguracionService,
    UbicacionesService, FormativoService, HorariosAdminService,
  ],
  exports: [AuthCGService],
})
export class ChronogestModule {}
