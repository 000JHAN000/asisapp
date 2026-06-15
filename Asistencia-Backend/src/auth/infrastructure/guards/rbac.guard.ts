import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolOrmEntity } from 'src/rol/infrastructure/entities/rol.orm-entity';

@Injectable()
export class RbacGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(RolOrmEntity)
    private readonly rolRepo: Repository<RolOrmEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesRequeridos || rolesRequeridos.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const usuario  = request.user;

    // Si tiene un rol en formato texto (Chronogest)
    if (usuario?.rol) {
      const tieneAcceso = rolesRequeridos.includes(usuario.rol);
      if (!tieneAcceso) throw new ForbiddenException(`Se requiere uno de estos roles: ${rolesRequeridos.join(', ')}`);
      return true;
    }

    if (!usuario?.id_rol) throw new ForbiddenException('Sin rol asignado');

    const rol = await this.rolRepo.findOneBy({ id_rol: usuario.id_rol });
    if (!rol) throw new ForbiddenException('Rol no encontrado');

    const tieneAcceso = rolesRequeridos.includes(rol.nombre);
    if (!tieneAcceso) throw new ForbiddenException(`Se requiere uno de estos roles: ${rolesRequeridos.join(', ')}`);

    return true;
  }
}