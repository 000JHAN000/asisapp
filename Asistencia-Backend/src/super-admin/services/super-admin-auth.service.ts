import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare } from 'bcrypt';
import { CredencialOrmEntity } from '../../credencial/infrastructure/entities/credencial.orm-entity';
import { UsuarioOrmEntity } from '../../usuario/infrastructure/entities/usuario.orm-entity';
import { PersonaOrmEntity } from '../../persona/infrastructure/entities/persona.orm-entity';

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
    @InjectRepository(CredencialOrmEntity)
    private readonly credencialRepo: Repository<CredencialOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @InjectRepository(PersonaOrmEntity)
    private readonly personaRepo: Repository<PersonaOrmEntity>,
    private readonly jwtService: JwtService,
  ) {}

  private async findCredencialByIdentifier(identifier: string) {
    const byLogin = await this.credencialRepo.findOne({
      where: { login: identifier },
      relations: ['usuario', 'usuario.persona', 'rol'],
    });
    if (byLogin) return byLogin;

    const persona = await this.personaRepo.findOne({ where: { documento: identifier } });
    if (!persona) return null;

    const usuario = await this.usuarioRepo.findOne({ where: { persona_fk: persona.id_persona } });
    if (!usuario) return null;

    return this.credencialRepo.findOne({
      where: { usuario_fk: usuario.id_usuario },
      relations: ['usuario', 'usuario.persona', 'rol'],
    });
  }

  async login(identifier: string, password: string) {
    const credencial = await this.findCredencialByIdentifier(identifier);
    if (!credencial || !credencial.usuario || !credencial.usuario.persona) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const usuario = credencial.usuario;
    const persona = usuario.persona;
    const rolNombre = credencial.rol?.nombre ?? '';

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    if (rolNombre !== 'super_admin') {
      throw new UnauthorizedException('Acceso exclusivo para super administradores');
    }

    const valid = await compare(password, credencial.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload: SuperAdminJwtPayload = {
      sub: usuario.id_usuario,
      correo: persona.correo,
      documento: persona.documento,
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
        id: usuario.id_usuario,
        correo: persona.correo,
        documento: persona.documento,
        rol: rolNombre,
      },
    };
  }
}
