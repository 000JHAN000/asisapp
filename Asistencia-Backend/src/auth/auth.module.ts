import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredencialOrmEntity } from 'src/credencial/infrastructure/entities/credencial.orm-entity';
import { AccesoOrmEntity }     from 'src/acceso/infrastructure/entities/acceso.orm-entity';
import { RolOrmEntity }        from 'src/rol/infrastructure/entities/rol.orm-entity';
import { AuthTypeOrmRepository } from './infrastructure/adapters/auth.typeorm.repository';
import { AuthService }           from './application/auth.service';
import { AuthController }        from './infrastructure/http/auth.controller';
import { JwtStrategy }           from './infrastructure/strategies/jwt.strategy';
import { JwtGuard }              from './infrastructure/guards/jwt.guard';
import { RbacGuard }             from './infrastructure/guards/rbac.guard';
import { RebacGuard }            from './infrastructure/guards/rebac.guard';
import { AUTH_REPOSITORY }       from './domain/ports/auth.repository.port';
import { PersonaOrmEntity } from 'src/persona/infrastructure/entities/persona.orm-entity';
import { UsuarioOrmEntity } from 'src/usuario/infrastructure/entities/usuario.orm-entity';
import { TenantModule } from 'src/auth/infrastructure/persistence/tenants/tenant.module';
import { AuthCGController } from './infrastructure/http/auth-cg.controller';
import { AuthCGService } from './application/auth-cg.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.get<string>('JWT_SECRET')!,
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES')! as `${number}${'s'|'m'|'h'|'d'}` },
      }),
    }),
    TypeOrmModule.forFeature([CredencialOrmEntity, AccesoOrmEntity, RolOrmEntity, PersonaOrmEntity, UsuarioOrmEntity]),
    TenantModule,
  ],
  controllers: [AuthController, AuthCGController],
  providers: [
    AuthService,
    AuthCGService,
    JwtStrategy,
    JwtGuard,
    RbacGuard,
    RebacGuard,
    {
      provide: AUTH_REPOSITORY,
      useClass: AuthTypeOrmRepository,
    },
  ],
  exports: [JwtGuard, JwtStrategy, RbacGuard, RebacGuard, AuthCGService],
})
export class AuthModule {}