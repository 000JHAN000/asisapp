// infrastructure/adapters/usuario.typeorm.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioRepositoryPort } from '../../domain/ports/usuario.repository.port';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioOrmEntity } from '../entities/usuario.orm-entity';

@Injectable()
export class UsuarioTypeOrmRepository implements UsuarioRepositoryPort {

  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly repo: Repository<UsuarioOrmEntity>,
  ) {}

  crear(datos: Partial<Usuario>): Promise<Usuario> {
    const nuevo = this.repo.create(datos);
    return this.repo.save(nuevo);
  }

  listarPorAplicativo(aplicativoId: string): Promise<Usuario[]> {
  return this.repo.find({
    where: { aplicativo_fk: aplicativoId },
    relations: ['persona', 'aplicativo'],
  });
}
  listar(): Promise<Usuario[]> {
    return this.repo.find({ relations: ['persona', 'aplicativo'] });
  }

  async buscarPorId(id: string): Promise<Usuario> {
    const encontrado = await this.repo.findOneBy({ id_usuario: id });
    if (!encontrado) throw new NotFoundException(`Usuario ${id} no existe`);
    return encontrado;
  }

  async actualizar(id: string, datos: Partial<Usuario>): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.update(id, datos);
  }

  async eliminar(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.repo.delete(id);
  }
}