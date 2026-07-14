import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroMasivoController } from './infrastructure/http/registro-masivo.controller';
import { RegistroMasivoService } from './application/registro-masivo.service';
import { PersonaOrmEntity } from 'src/persona/infrastructure/entities/persona.orm-entity';
import { UsuarioOrmEntity } from 'src/usuario/infrastructure/entities/usuario.orm-entity';
import { CredencialOrmEntity } from 'src/credencial/infrastructure/entities/credencial.orm-entity';
import { RolOrmEntity } from 'src/rol/infrastructure/entities/rol.orm-entity';
import { UsuarioMaestro } from 'src/auth/infrastructure/entities/usuario-maestro.orm-entity';
import { TenantModule } from 'src/auth/infrastructure/persistence/tenants/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PersonaOrmEntity,
      UsuarioOrmEntity,
      CredencialOrmEntity,
      RolOrmEntity,
      UsuarioMaestro,
    ]),
    TenantModule,
  ],
  controllers: [RegistroMasivoController],
  providers: [RegistroMasivoService],
})
export class RegistroMasivoModule {}
