import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcrypt';

import { UsuarioCG } from '../entities/usuario-cg.entity';
import { InstructorCG } from '../entities/instructor-cg.entity';
import { AprendizCG } from '../entities/aprendiz-cg.entity';
import { AdminCG } from '../entities/admin-cg.entity';
import { ConfiguracionApp } from '../entities/configuracion-app.entity';

@Injectable()
export class AuthCGService {
  private tokenBlacklist = new Set<string>();

  constructor(
    @InjectRepository(UsuarioCG)
    private readonly usuarioRepo: Repository<UsuarioCG>,
    @InjectRepository(InstructorCG)
    private readonly instructorRepo: Repository<InstructorCG>,
    @InjectRepository(AprendizCG)
    private readonly aprendizRepo: Repository<AprendizCG>,
    @InjectRepository(AdminCG)
    private readonly adminRepo: Repository<AdminCG>,
    @InjectRepository(ConfiguracionApp)
    private readonly configRepo: Repository<ConfiguracionApp>,
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

    const valid = await compare(password, usuario.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    let perfil: any;
    if (usuario.rol === 'instructor') {
      perfil = await this.instructorRepo.findOne({ where: { documento: usuario.documento } });
    } else if (usuario.rol === 'aprendiz') {
      perfil = await this.aprendizRepo.findOne({ where: { documento: usuario.documento } });
    } else if (usuario.rol === 'admin') {
      perfil = await this.adminRepo.findOne({ where: { documento: usuario.documento } });
    }

    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      documento: usuario.documento,
      rol: usuario.rol,
      perfilId: perfil?.id ?? null,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'default-secret',
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
    });

    return {
      access_token,
      user: {
        id: usuario.id,
        perfilId: perfil?.id ?? null,
        nombre: perfil?.nombre ?? null,
        apellido: perfil?.apellido ?? null,
        correo: usuario.correo,
        documento: usuario.documento,
        rol: usuario.rol,
        fichaId: perfil?.fichaId ?? null,
      },
    };
  }

  logout(token: string) {
    if (token) {
      this.tokenBlacklist.add(token);
    }
    return { success: true };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklist.has(token);
  }

  async register(data: any) {
    const {
      nombre,
      apellido,
      correo,
      documento: docOriginal,
      numDoc,
      password,
      rol,
      fichaId,
      esLider,
      areaLiderada,
      esTransversal,
    } = data;

    const documento = docOriginal || numDoc;

    const exists = await this.usuarioRepo.findOne({
      where: [{ correo }, { documento }],
    });

    if (exists) {
      throw new BadRequestException('Correo o documento ya registrado');
    }

    const hashed = await hash(password, 10);

    const usuario = await this.usuarioRepo.save({
      correo,
      documento,
      password: hashed,
      rol,
      activo: true,
    });

    if (rol === 'instructor') {
      await this.instructorRepo.save({
        nombre,
        apellido,
        correo,
        documento,
        esLider: esLider ?? false,
        areaLiderada,
        esTransversal: esTransversal ?? false,
      });
    } else if (rol === 'aprendiz') {
      await this.aprendizRepo.save({
        nombre,
        apellido,
        correo,
        documento,
        fichaId,
      });
    } else if (rol === 'admin') {
      await this.adminRepo.save({
        nombre,
        apellido,
        correo,
        documento,
      });
    }

    return {
      success: true,
      user: {
        id: usuario.id,
        correo: usuario.correo,
        documento: usuario.documento,
        rol: usuario.rol,
      },
    };
  }

  async verifyPin(pin: string) {
    const config = await this.configRepo.findOne({ where: {} });
    return { valid: config?.pinRegistro === pin };
  }

  forgotPassword(_data: any) {
    return { success: true };
  }

  verifyResetCode(_data: any) {
    return { success: true };
  }

  resetPassword(_data: any) {
    return { success: true };
  }

  async me(userId: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: userId } });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    let perfil: any;
    if (usuario.rol === 'instructor') {
      perfil = await this.instructorRepo.findOne({ where: { documento: usuario.documento } });
    } else if (usuario.rol === 'aprendiz') {
      perfil = await this.aprendizRepo.findOne({ where: { documento: usuario.documento } });
    } else if (usuario.rol === 'admin') {
      perfil = await this.adminRepo.findOne({ where: { documento: usuario.documento } });
    }

    return {
      id: usuario.id,
      perfilId: perfil?.id ?? null,
      nombre: perfil?.nombre ?? null,
      apellido: perfil?.apellido ?? null,
      correo: usuario.correo,
      documento: usuario.documento,
      rol: usuario.rol,
      fichaId: perfil?.fichaId ?? null,
    };
  }
}
