import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcrypt';
import * as xlsx from 'xlsx';

import { PersonaOrmEntity } from 'src/persona/infrastructure/entities/persona.orm-entity';
import { UsuarioOrmEntity } from 'src/usuario/infrastructure/entities/usuario.orm-entity';
import { CredencialOrmEntity } from 'src/credencial/infrastructure/entities/credencial.orm-entity';
import { RolOrmEntity } from 'src/rol/infrastructure/entities/rol.orm-entity';
import { UsuarioMaestro } from 'src/auth/infrastructure/entities/usuario-maestro.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { InstructorOrmEntity } from 'src/persona/infrastructure/entities/instructor.orm-entity';
import { CursoOrmEntity } from 'src/curso/infrastructure/entities/curso.orm-entity';
import { MatriculaOrmEntity } from 'src/matricula/infrastructure/entities/matricula.orm-entity';
import { GeneroPersona } from 'src/persona/domain/entities/persona.entity';

export interface RegistroMasivoResultado {
  total: number;
  exitosos: number;
  fallidos: number;
  errores: { fila: number; datos: Record<string, any>; error: string }[];
}

export type TipoRegistroMasivo = 'aprendices' | 'instructores';

@Injectable()
export class RegistroMasivoService {
  private readonly APLICATIVO_FK_DEFAULT = '11111111-1111-1111-1111-111111111111';

  constructor(
    @InjectRepository(PersonaOrmEntity)
    private readonly personaRepo: Repository<PersonaOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @InjectRepository(CredencialOrmEntity)
    private readonly credencialRepo: Repository<CredencialOrmEntity>,
    @InjectRepository(RolOrmEntity)
    private readonly rolRepo: Repository<RolOrmEntity>,
    @InjectRepository(UsuarioMaestro)
    private readonly usuarioMaestroRepo: Repository<UsuarioMaestro>,
    private readonly tenantConnectionManager: TenantConnectionManager,
  ) {}

  async procesar(
    file: Buffer,
    tipo: TipoRegistroMasivo,
    tenantSlug: string,
  ): Promise<RegistroMasivoResultado> {
    if (!file || file.length === 0) {
      throw new BadRequestException('El archivo está vacío');
    }

    const filas = this.parsearArchivo(file, tipo);
    const resultado: RegistroMasivoResultado = {
      total: filas.length,
      exitosos: 0,
      fallidos: 0,
      errores: [],
    };

    const rolEntity = await this.rolRepo.findOne({ where: { nombre: tipo === 'aprendices' ? 'aprendiz' : 'instructor' } });
    if (!rolEntity) {
      throw new BadRequestException(`Rol '${tipo === 'aprendices' ? 'aprendiz' : 'instructor'}' no configurado en el sistema`);
    }

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const numeroFila = i + 2; // +1 por header, +1 por base 0

      try {
        await this.procesarFila(fila, tipo, tenantSlug, rolEntity.id_rol);
        resultado.exitosos++;
      } catch (error: any) {
        resultado.fallidos++;
        resultado.errores.push({
          fila: numeroFila,
          datos: fila,
          error: error.message || 'Error desconocido',
        });
      }
    }

    return resultado;
  }

  private parsearArchivo(file: Buffer, tipo: TipoRegistroMasivo): Record<string, any>[] {
    const workbook = xlsx.read(file, { type: 'buffer' });

    // Si existe una hoja con el nombre del tipo (Aprendices/Instructores), usarla.
    const sheetName = workbook.SheetNames.find(
      (name) => name.toLowerCase() === tipo.toLowerCase(),
    );
    const worksheet = workbook.Sheets[sheetName ?? workbook.SheetNames[0]];

    const raw = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    if (raw.length < 2) {
      return [];
    }

    const headers = (raw[0] as any[]).map((h) => this.normalizarColumna(h));
    return raw.slice(1).map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] ?? '';
      });
      return obj;
    });
  }

  private normalizarColumna(value: any): string {
    return String(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .trim();
  }

  private async procesarFila(
    fila: Record<string, any>,
    tipo: TipoRegistroMasivo,
    tenantSlug: string,
    rolId: string,
  ): Promise<void> {
    const nombre = this.obtenerString(fila, 'nombre');
    const apellido = this.obtenerString(fila, 'apellido');
    const numDoc = this.obtenerString(fila, 'num_doc');
    const correo = this.obtenerString(fila, 'correo');

    if (!nombre) throw new Error('El campo "nombre" es obligatorio');
    if (!apellido) throw new Error('El campo "apellido" es obligatorio');
    if (!numDoc) throw new Error('El campo "num_doc" es obligatorio');
    if (!correo) throw new Error('El campo "correo" es obligatorio');

    if (!this.validarCorreo(correo)) {
      throw new Error('El correo no tiene un formato válido');
    }

    const existePorCorreo = await this.personaRepo.findOne({ where: { correo } });
    if (existePorCorreo) {
      throw new Error('El correo ya está registrado');
    }

    const existePorDocumento = await this.personaRepo.findOne({ where: { documento: numDoc } });
    if (existePorDocumento) {
      throw new Error('El número de documento ya está registrado');
    }

    const tipoDoc = this.obtenerString(fila, 'tipo_doc');
    const telefono = this.obtenerString(fila, 'telefono');
    const generoRaw = this.obtenerString(fila, 'genero');
    const genero = this.normalizarGenero(generoRaw);
    const municipio = this.obtenerString(fila, 'municipio');

    const hashedPassword = await hash(numDoc, 10);

    const persona = await this.personaRepo.save({
      nombres: nombre,
      apellidos: apellido,
      documento: numDoc,
      correo,
      telefono: telefono || null,
      tipo_doc: tipoDoc || null,
      genero,
      municipio_nombre: municipio || null,
      estado: 'activo' as any,
    });

    const usuario = await this.usuarioRepo.save({
      persona_fk: persona.id_persona,
      aplicativo_fk: this.APLICATIVO_FK_DEFAULT,
      tenant_slug: tenantSlug,
      activo: true,
    });

    await this.credencialRepo.save({
      login: correo,
      password: hashedPassword,
      rol_fk: rolId,
      usuario_fk: usuario.id_usuario,
    });

    await this.usuarioMaestroRepo.save({
      correo,
      documento: numDoc,
      password: hashedPassword,
      rol: tipo === 'aprendices' ? 'aprendiz' : 'instructor',
      personaId: persona.id_persona,
      activo: true,
      tipoDoc: tipoDoc || null,
      municipio: municipio || null,
      tenantSlug,
    });

    // Perfil en la BD del tenant
    const personaTenantRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, PersonaOrmEntity);
    let personaTenant = await personaTenantRepo.findOne({ where: { documento: numDoc } });
    if (personaTenant) {
      personaTenant.nombres = nombre;
      personaTenant.apellidos = apellido;
      personaTenant.correo = correo;
      personaTenant.telefono = telefono || null;
      personaTenant.tipo_doc = tipoDoc || null;
      personaTenant.genero = genero;
      personaTenant.municipio_nombre = municipio || null;
      personaTenant.estado = 'activo' as any;
      personaTenant = await personaTenantRepo.save(personaTenant);
    } else {
      personaTenant = await personaTenantRepo.save({
        documento: numDoc,
        nombres: nombre,
        apellidos: apellido,
        correo,
        telefono: telefono || null,
        tipo_doc: tipoDoc || null,
        genero,
        municipio_nombre: municipio || null,
        estado: 'activo' as any,
      });
    }

    if (tipo === 'instructores') {
      const area = this.obtenerString(fila, 'area');
      const instructorRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, InstructorOrmEntity);
      await instructorRepo.save({
        persona_fk: personaTenant.id_persona,
        areaLiderada: area || null,
      });
    } else {
      const fichaCodigo = this.obtenerString(fila, 'ficha_codigo');
      if (fichaCodigo) {
        const cursoRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, CursoOrmEntity);
        const curso = await cursoRepo.findOne({ where: { codigo: fichaCodigo } });
        if (!curso) {
          throw new Error(`La ficha '${fichaCodigo}' no existe en esta sede`);
        }
        const matriculaRepo = await this.tenantConnectionManager.getTenantRepository(tenantSlug, MatriculaOrmEntity);
        await matriculaRepo.save({
          persona_fk: personaTenant.id_persona,
          curso_fk: curso.id_curso,
        });
      }
    }
  }

  private obtenerString(fila: Record<string, any>, columna: string): string {
    const value = fila[columna];
    if (value === undefined || value === null || value === '') {
      return '';
    }
    return String(value).trim();
  }

  private validarCorreo(correo: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  }

  private normalizarGenero(genero: string): GeneroPersona | null {
    const g = genero.toLowerCase();
    if (g === 'masculino' || g === 'm') return GeneroPersona.masculino;
    if (g === 'femenino' || g === 'f') return GeneroPersona.femenino;
    return null;
  }
}
