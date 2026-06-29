import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare } from 'bcrypt';
import { UsuarioCG } from '../../chronogest/entities/usuario-cg.entity';

export interface SuperAdminJwtPayload {
  sub: string;
  correo: string;
  documento: string;
  rol: 'super_admin';
  scope: 'platform';
}

@Injectable()
export class SuperAdminAuthService {
  constructor(
    @InjectRepository(UsuarioCG)
    private readonly usuarioRepo: Repository<UsuarioCG>,
    private readonly jwtService: JwtService,
  ) {}

  async login(identifier: string, password: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: [{ correo: identifier }, { documento: identifier }],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    if (usuario.rol !== 'super_admin') {
      throw new UnauthorizedException('Acceso exclusivo para super administradores');
    }

    const valid = await compare(password, usuario.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload: SuperAdminJwtPayload = {
      sub: usuario.id,
      correo: usuario.correo,
      documento: usuario.documento,
      rol: 'super_admin',
      scope: 'platform',
    };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'default-secret',
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
    });

    return {
      access_token,
      user: {
        id: usuario.id,
        correo: usuario.correo,
        documento: usuario.documento,
        rol: usuario.rol,
      },
    };
  }
}
