import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SuperAdminJwtPayload } from '../services/super-admin-auth.service';

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
