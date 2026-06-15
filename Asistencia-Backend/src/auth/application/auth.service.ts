// application/auth.service.ts

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { type AuthRepositoryPort, AUTH_REPOSITORY } from '../domain/ports/auth.repository.port';
import { LoginDto } from '../infrastructure/http/dto/login.dto';

@Injectable()
export class AuthService {

  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

async login(dto: LoginDto) {
  const credencial = await this.repo.buscarCredencialPorLogin(dto.login);
  if (!credencial) throw new UnauthorizedException('Credenciales incorrectas');

  const passwordValido = await compare(dto.password, credencial.password);
  if (!passwordValido) throw new UnauthorizedException('Credenciales incorrectas');

  const payload = {
    sub:           credencial.usuario_fk,
    login:         credencial.login,
    id_rol:        credencial.rol_fk,
    persona_fk:    credencial.persona_fk,
    aplicativo_fk: credencial.aplicativo_fk,
  };

  const token = this.jwtService.sign(payload);

  await this.repo.guardarAcceso({ token, usuario_fk: credencial.usuario_fk });

  // 🔥 Buscar nombre de la persona
  const persona = await this.repo.buscarPersonaPorId(credencial.persona_fk);

  return {
    access_token: token,
    usuario: {
      id:          credencial.usuario_fk,
      login:       credencial.login,
      rol:         credencial.rol_fk,
      aplicativoId: credencial.aplicativo_fk,
      personaId:   credencial.persona_fk,
      nombre:       persona?.nombres ?? credencial.login,
    }
  };
}

  async logout(token: string) {
    await this.repo.invalidarAcceso(token);
    return { mensaje: 'Sesión cerrada correctamente' };
  }
}