import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface SuperAdminJwtPayload {
  sub: string;
  correo: string;
  documento: string;
  rol: 'super_admin';
  scope: 'platform';
}

@Injectable()
export class SuperAdminJwtStrategy extends PassportStrategy(Strategy, 'super-admin-jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: SuperAdminJwtPayload) {
    if (payload.scope !== 'platform' || payload.rol !== 'super_admin') {
      throw new UnauthorizedException('Token no válido para plataforma');
    }
    return payload;
  }
}
