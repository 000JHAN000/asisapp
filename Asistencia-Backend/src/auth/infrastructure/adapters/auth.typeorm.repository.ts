import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthRepositoryPort } from '../../domain/ports/auth.repository.port';
import { CredencialOrmEntity } from 'src/credencial/infrastructure/entities/credencial.orm-entity';
import { AccesoOrmEntity }     from 'src/acceso/infrastructure/entities/acceso.orm-entity';
import { PersonaOrmEntity }    from 'src/persona/infrastructure/entities/persona.orm-entity';
import { EstadoAcceso }        from 'src/acceso/domain/entities/acceso.entity';

@Injectable()
export class AuthTypeOrmRepository implements AuthRepositoryPort {

  constructor(
    @InjectRepository(CredencialOrmEntity)
    private readonly credencialRepo: Repository<CredencialOrmEntity>,

    @InjectRepository(AccesoOrmEntity)
    private readonly accesoRepo: Repository<AccesoOrmEntity>,

    @InjectRepository(PersonaOrmEntity)                          // ← agregado
    private readonly personaRepo: Repository<PersonaOrmEntity>,  // ← agregado
  ) {}

  async buscarCredencialPorLogin(login: string) {
    const credencial = await this.credencialRepo.findOne({
      where: { login },
      relations: ['usuario'],
      select: {
        id_credencial: true,
        login:         true,
        password:      true,
        usuario_fk:    true,
        rol_fk:        true,
        usuario: {
          persona_fk:    true,
          aplicativo_fk: true,
        },
      },
    });

    if (!credencial) return null;

    return {
      id_credencial: credencial.id_credencial,
      login:         credencial.login,
      password:      credencial.password,
      usuario_fk:    credencial.usuario_fk,
      rol_fk:        credencial.rol_fk,
      persona_fk:    credencial.usuario?.persona_fk,
      aplicativo_fk: credencial.usuario?.aplicativo_fk,
    };
  }

  async buscarPersonaPorId(personaId: string): Promise<{ nombres: string } | null> {
    const persona = await this.personaRepo.findOne({
      where: { id_persona: personaId },
      select: { nombres: true },
    });

    return persona ?? null;
  }

  async guardarAcceso(datos: { token: string; usuario_fk: string }): Promise<void> {
    const accesoExistente = await this.accesoRepo.findOne({
      where: { usuario_fk: datos.usuario_fk },
      order: { fecha_ingreso: 'DESC' },
    });

    if (accesoExistente && accesoExistente.estado === EstadoAcceso.activo) {
      await this.accesoRepo.update(accesoExistente.id_acceso, {
        token:         datos.token,
        fecha_ingreso: new Date(),
      });
    } else {
      const nuevo = this.accesoRepo.create({
        token:      datos.token,
        usuario_fk: datos.usuario_fk,
        estado:     EstadoAcceso.activo,
      });
      await this.accesoRepo.save(nuevo);
    }
  }

  async invalidarAcceso(token: string): Promise<void> {
    await this.accesoRepo.update(
      { token },
      { estado: EstadoAcceso.inactivo, fecha_salida: new Date() },
    );
  }
}