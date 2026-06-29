import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioCG } from '../chronogest/entities/usuario-cg.entity';
import { TenantModule } from '../infrastructure/persistence/tenants/tenant.module';

import { SuperAdminAuthService } from './services/super-admin-auth.service';
import { TenantProvisioningService } from './services/tenant-provisioning.service';

import { SuperAdminAuthController } from './controllers/super-admin-auth.controller';
import { TenantsAdminController } from './controllers/tenants-admin.controller';

import { SuperAdminJwtStrategy } from './guards/super-admin-jwt.strategy';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([UsuarioCG]),
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
