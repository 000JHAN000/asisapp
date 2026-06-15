import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { OWNERSHIP_KEY, OwnershipConfig } from '../decorators/ownership.decorator';

@Injectable()
export class RebacGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.getAllAndOverride<OwnershipConfig>(OWNERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // si no tiene @CheckOwnership, deja pasar
    if (!config) return true;

    const request = context.switchToHttp().getRequest();
    const usuario  = request.user;
    const id       = request.params.id;

    // admin siempre puede
    if (!id) return true;

    const repo     = this.dataSource.getRepository(config.tabla);
    const registro = await repo.findOne({ where: { [`id_${config.tabla}`]: id } });

    if (!registro) throw new ForbiddenException('Recurso no encontrado');

    const valorCampo    = registro[config.campo];
    const valorUsuario  = config.tipo === 'usuario' ? usuario.sub : usuario.persona_fk;

    if (valorCampo !== valorUsuario) {
      throw new ForbiddenException('No tienes permiso sobre este recurso');
    }

    return true;
  }
}