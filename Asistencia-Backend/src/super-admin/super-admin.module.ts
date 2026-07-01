import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredencialOrmEntity } from '../credencial/infrastructure/entities/credencial.orm-entity';
import { UsuarioOrmEntity } from '../usuario/infrastructure/entities/usuario.orm-entity';
import { PersonaOrmEntity } from '../persona/infrastructure/entities/persona.orm-entity';
import { RolOrmEntity } from '../rol/infrastructure/entities/rol.orm-entity';
import { TenantModule } from 'src/auth/infrastructure/persistence/tenants/tenant.module';

import { SuperAdminAuthService } from './services/super-admin-auth.service';
import { TenantProvisioningService } from 'src/auth/application/tenant-provisioning.service';

import { SuperAdminAuthController } from './controllers/super-admin-auth.controller';
import { TenantsAdminController } from 'src/auth/infrastructure/http/tenants-admin.controller';

import { SuperAdminJwtStrategy } from './guards/super-admin-jwt.strategy';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([CredencialOrmEntity, UsuarioOrmEntity, PersonaOrmEntity, RolOrmEntity]),
    TenantModule,
  ],
  controllers: [SuperAdminAuthController, TenantsAdminController],
  providers: [
    SuperAdminAuthService,
    TenantProvisioningService,
    SuperAdminJwtStrategy,
    SuperAdminGuard,
  ],
})
export class SuperAdminModule {}
