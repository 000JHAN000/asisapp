import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityTarget, FindManyOptions, ObjectLiteral, Repository } from 'typeorm';

import { CentroFormacionOrmEntity } from '../../centro-formacion/infrastructure/entities/centro-formacion.orm-entity';
import { SedeOrmEntity } from '../../sede/infrastructure/entities/sede.orm-entity';
import { DepartamentoOrmEntity } from '../../departamento/infrastructure/entities/departamento.orm-entity';
import { MunicipioOrmEntity } from '../../municipio/infrastructure/entities/municipio.orm-entity';
import { AreaOrmEntity } from '../../area/infrastructure/entities/area.orm-entity';
import { ProgramaOrmEntity } from '../../programa/infrastructure/entities/programa.orm-entity';
import { PersonaOrmEntity } from '../../persona/infrastructure/entities/persona.orm-entity';
import { CursoOrmEntity } from '../../curso/infrastructure/entities/curso.orm-entity';
import { MatriculaOrmEntity } from '../../matricula/infrastructure/entities/matricula.orm-entity';
import { AplicativoOrmEntity } from '../../aplicativo/infrastructure/entities/aplicativo.orm-entity';
import { ModuloOrmEntity } from '../../modulo/infrastructure/entities/modulo.orm-entity';
import { ServicioOrmEntity } from '../../servicio/infrastructure/entities/servicio.orm-entity';
import { UsuarioOrmEntity } from '../../usuario/infrastructure/entities/usuario.orm-entity';
import { CredencialOrmEntity } from '../../credencial/infrastructure/entities/credencial.orm-entity';
import { PermisoOrmEntity } from '../../permiso/infrastructure/entities/permiso.orm-entity';
import { AccesoOrmEntity } from '../../acceso/infrastructure/entities/acceso.orm-entity';
import { RolOrmEntity } from '../../rol/infrastructure/entities/rol.orm-entity';
import { AmbienteOrmEntity } from '../../ambiente/infrastructure/entities/ambiente.orm-entity';
import { TenantConnectionManager } from 'src/auth/infrastructure/persistence/tenants/tenant-connection.manager';
import { getCurrentTenantId } from '../../infrastructure/config/tenant-context';

@Injectable()
export class FormativoCGService {
  constructor(
    private readonly connectionManager: TenantConnectionManager,
    // Departamentos/municipios (catálogo geográfico, usado en el registro público antes de tener
    // tenant) y usuario/credencial/rol/acceso/aplicativo (entidades de autenticación que ya vive
    // en la BD compartida — las usan AuthCGService, RbacGuard y UsuariosCGService) se quedan en
    // la conexión por defecto para no crear una copia paralela desconectada del login real.
    @InjectRepository(DepartamentoOrmEntity)
    private readonly departamentoRepo: Repository<DepartamentoOrmEntity>,
    @InjectRepository(MunicipioOrmEntity)
    private readonly municipioRepo: Repository<MunicipioOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @InjectRepository(CredencialOrmEntity)
    private readonly credencialRepo: Repository<CredencialOrmEntity>,
    @InjectRepository(RolOrmEntity)
    private readonly rolRepo: Repository<RolOrmEntity>,
    @InjectRepository(AccesoOrmEntity)
    private readonly accesoRepo: Repository<AccesoOrmEntity>,
    @InjectRepository(AplicativoOrmEntity)
    private readonly aplicativoRepo: Repository<AplicativoOrmEntity>,
  ) {}

  private get tenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new BadRequestException('No se ha resuelto el tenant para la petición');
    }
    return tenantId;
  }

  private async getRepo<T extends ObjectLiteral>(entity: EntityTarget<T>): Promise<Repository<T>> {
    return this.connectionManager.getTenantRepository(this.tenantId, entity);
  }

  // ─── Centros ───
  async findAllCentros() {
    return (await this.getRepo(CentroFormacionOrmEntity)).find();
  }
  async findOneCentro(id: string) {
    return (await this.getRepo(CentroFormacionOrmEntity)).findOneBy({ id_centro: id });
  }
  async createCentro(data: Partial<CentroFormacionOrmEntity>) {
    return (await this.getRepo(CentroFormacionOrmEntity)).save(data);
  }
  async updateCentro(id: string, data: Partial<CentroFormacionOrmEntity>) {
    return (await this.getRepo(CentroFormacionOrmEntity)).update({ id_centro: id }, data);
  }
  async removeCentro(id: string) {
    return (await this.getRepo(CentroFormacionOrmEntity)).delete({ id_centro: id });
  }

  // ─── Sedes ───
  async findAllSedes() {
    return (await this.getRepo(SedeOrmEntity)).find();
  }
  async findOneSede(id: string) {
    return (await this.getRepo(SedeOrmEntity)).findOneBy({ id_sede: id });
  }
  async createSede(data: Partial<SedeOrmEntity>) {
    return (await this.getRepo(SedeOrmEntity)).save(data);
  }
  async updateSede(id: string, data: Partial<SedeOrmEntity>) {
    return (await this.getRepo(SedeOrmEntity)).update({ id_sede: id }, data);
  }
  async removeSede(id: string) {
    return (await this.getRepo(SedeOrmEntity)).delete({ id_sede: id });
  }

  // ─── Departamentos (catálogo compartido) ───
  findAllDepartamentos() {
    return this.departamentoRepo.find();
  }
  findOneDepartamento(id: string) {
    return this.departamentoRepo.findOneBy({ id_departamento: id });
  }
  createDepartamento(data: Partial<DepartamentoOrmEntity>) {
    return this.departamentoRepo.save(data);
  }
  updateDepartamento(id: string, data: Partial<DepartamentoOrmEntity>) {
    return this.departamentoRepo.update({ id_departamento: id }, data);
  }
  removeDepartamento(id: string) {
    return this.departamentoRepo.delete({ id_departamento: id });
  }

  // ─── Municipios (catálogo compartido) ───
  findAllMunicipios() {
    return this.municipioRepo.find();
  }
  findOneMunicipio(id: string) {
    return this.municipioRepo.findOneBy({ id_municipio: id });
  }
  createMunicipio(data: Partial<MunicipioOrmEntity>) {
    return this.municipioRepo.save(data);
  }
  updateMunicipio(id: string, data: Partial<MunicipioOrmEntity>) {
    return this.municipioRepo.update({ id_municipio: id }, data);
  }
  removeMunicipio(id: string) {
    return this.municipioRepo.delete({ id_municipio: id });
  }

  // ─── Ambientes ───
  async findAllAmbientes() {
    const ambientes = await (await this.getRepo(AmbienteOrmEntity)).find({ relations: ['area'] });
    return ambientes.map((a) => ({
      ...a,
      id: a.id_ambiente,
      area_nombre: a.area?.nombre ?? null,
    }));
  }
  async findOneAmbiente(id: string) {
    return (await this.getRepo(AmbienteOrmEntity)).findOneBy({ id_ambiente: id });
  }
  async createAmbiente(data: Partial<AmbienteOrmEntity>) {
    return (await this.getRepo(AmbienteOrmEntity)).save(data);
  }
  async updateAmbiente(id: string, data: Partial<AmbienteOrmEntity>) {
    return (await this.getRepo(AmbienteOrmEntity)).update({ id_ambiente: id }, data);
  }
  async removeAmbiente(id: string) {
    return (await this.getRepo(AmbienteOrmEntity)).delete({ id_ambiente: id });
  }

  // ─── Áreas ───
  // Un tenant siempre tiene exactamente una sede propia (ver TenantProvisioningService),
  // así que el área se asocia automáticamente a esa sede: el administrador no elige
  // entre sedes porque en su base de datos nunca hay más de una.
  private async sedePropiaId(): Promise<string> {
    const sedeRepo = await this.getRepo(SedeOrmEntity);
    const sede = await sedeRepo.findOne({ where: {} });
    if (!sede) {
      throw new BadRequestException('Esta sede aún no tiene un Centro de Formación configurado.');
    }
    return sede.id_sede;
  }

  async findAllAreas() {
    const areas = await (await this.getRepo(AreaOrmEntity)).find({ relations: ['sede'] });
    return areas.map((a) => ({
      ...a,
      id: a.id_area,
      sede_nombre: a.sede?.nombre ?? null,
    }));
  }
  async findOneArea(id: string) {
    return (await this.getRepo(AreaOrmEntity)).findOneBy({ id_area: id });
  }
  async createArea(data: Partial<AreaOrmEntity>) {
    const sede_fk = data.sede_fk ?? (await this.sedePropiaId());
    return (await this.getRepo(AreaOrmEntity)).save({ ...data, sede_fk });
  }
  async updateArea(id: string, data: Partial<AreaOrmEntity>) {
    return (await this.getRepo(AreaOrmEntity)).update({ id_area: id }, data);
  }
  async removeArea(id: string) {
    return (await this.getRepo(AreaOrmEntity)).delete({ id_area: id });
  }

  // ─── Programas ───
  async findAllProgramas() {
    const programas = await (await this.getRepo(ProgramaOrmEntity)).find();
    return programas.map((p) => ({ ...p, id: p.id_programa }));
  }
  async findOnePrograma(id: string) {
    return (await this.getRepo(ProgramaOrmEntity)).findOneBy({ id_programa: id });
  }
  async createPrograma(data: Partial<ProgramaOrmEntity>) {
    return (await this.getRepo(ProgramaOrmEntity)).save(data);
  }
  async updatePrograma(id: string, data: Partial<ProgramaOrmEntity>) {
    return (await this.getRepo(ProgramaOrmEntity)).update({ id_programa: id }, data);
  }
  async removePrograma(id: string) {
    return (await this.getRepo(ProgramaOrmEntity)).delete({ id_programa: id });
  }

  // ─── Personas ───
  async findAllPersonas() {
    return (await this.getRepo(PersonaOrmEntity)).find();
  }
  async findOnePersona(id: string) {
    return (await this.getRepo(PersonaOrmEntity)).findOneBy({ id_persona: id });
  }
  async createPersona(data: Partial<PersonaOrmEntity>) {
    return (await this.getRepo(PersonaOrmEntity)).save(data);
  }
  async updatePersona(id: string, data: Partial<PersonaOrmEntity>) {
    return (await this.getRepo(PersonaOrmEntity)).update({ id_persona: id }, data);
  }
  async removePersona(id: string) {
    return (await this.getRepo(PersonaOrmEntity)).delete({ id_persona: id });
  }

  // ─── Cursos ───
  async findAllCursos() {
    return (await this.getRepo(CursoOrmEntity)).find();
  }
  async findOneCurso(id: string) {
    return (await this.getRepo(CursoOrmEntity)).findOneBy({ id_curso: id });
  }
  async createCurso(data: Partial<CursoOrmEntity>) {
    return (await this.getRepo(CursoOrmEntity)).save(data);
  }
  async updateCurso(id: string, data: Partial<CursoOrmEntity>) {
    return (await this.getRepo(CursoOrmEntity)).update({ id_curso: id }, data);
  }
  async removeCurso(id: string) {
    return (await this.getRepo(CursoOrmEntity)).delete({ id_curso: id });
  }

  // ─── Matrículas ───
  async findAllMatriculas() {
    return (await this.getRepo(MatriculaOrmEntity)).find();
  }
  async findOneMatricula(id: string) {
    return (await this.getRepo(MatriculaOrmEntity)).findOneBy({ id_matricula: id });
  }
  async createMatricula(data: Partial<MatriculaOrmEntity>) {
    return (await this.getRepo(MatriculaOrmEntity)).save(data);
  }
  async updateMatricula(id: string, data: Partial<MatriculaOrmEntity>) {
    return (await this.getRepo(MatriculaOrmEntity)).update({ id_matricula: id }, data);
  }
  async removeMatricula(id: string) {
    return (await this.getRepo(MatriculaOrmEntity)).delete({ id_matricula: id });
  }

  // ─── Aplicativos (compartido, referenciado por auth) ───
  findAllAplicativos() {
    return this.aplicativoRepo.find();
  }
  findOneAplicativo(id: string) {
    return this.aplicativoRepo.findOneBy({ id_aplicativo: id });
  }
  createAplicativo(data: Partial<AplicativoOrmEntity>) {
    return this.aplicativoRepo.save(data);
  }
  updateAplicativo(id: string, data: Partial<AplicativoOrmEntity>) {
    return this.aplicativoRepo.update({ id_aplicativo: id }, data);
  }
  removeAplicativo(id: string) {
    return this.aplicativoRepo.delete({ id_aplicativo: id });
  }

  // ─── Roles (compartido, catálogo fijo usado por RbacGuard) ───
  findAllRoles() {
    return this.rolRepo.find();
  }
  findOneRol(id: string) {
    return this.rolRepo.findOneBy({ id_rol: id });
  }
  createRol(data: Partial<RolOrmEntity>) {
    return this.rolRepo.save(data);
  }
  updateRol(id: string, data: Partial<RolOrmEntity>) {
    return this.rolRepo.update({ id_rol: id }, data);
  }
  removeRol(id: string) {
    return this.rolRepo.delete({ id_rol: id });
  }

  // ─── Módulos ───
  async findAllModulos() {
    return (await this.getRepo(ModuloOrmEntity)).find();
  }
  async findOneModulo(id: string) {
    return (await this.getRepo(ModuloOrmEntity)).findOneBy({ id_modulo: id });
  }
  async createModulo(data: Partial<ModuloOrmEntity>) {
    return (await this.getRepo(ModuloOrmEntity)).save(data);
  }
  async updateModulo(id: string, data: Partial<ModuloOrmEntity>) {
    return (await this.getRepo(ModuloOrmEntity)).update({ id_modulo: id }, data);
  }
  async removeModulo(id: string) {
    return (await this.getRepo(ModuloOrmEntity)).delete({ id_modulo: id });
  }

  // ─── Servicios ───
  async findAllServicios() {
    return (await this.getRepo(ServicioOrmEntity)).find();
  }
  async findOneServicio(id: string) {
    return (await this.getRepo(ServicioOrmEntity)).findOneBy({ id_servicio: id });
  }
  async createServicio(data: Partial<ServicioOrmEntity>) {
    return (await this.getRepo(ServicioOrmEntity)).save(data);
  }
  async updateServicio(id: string, data: Partial<ServicioOrmEntity>) {
    return (await this.getRepo(ServicioOrmEntity)).update({ id_servicio: id }, data);
  }
  async removeServicio(id: string) {
    return (await this.getRepo(ServicioOrmEntity)).delete({ id_servicio: id });
  }

  // ─── Usuarios (compartido, son las cuentas de login reales) ───
  findAllUsuarios() {
    return this.usuarioRepo.find();
  }
  findOneUsuario(id: string) {
    return this.usuarioRepo.findOneBy({ id_usuario: id });
  }
  createUsuario(data: Partial<UsuarioOrmEntity>) {
    return this.usuarioRepo.save(data);
  }
  updateUsuario(id: string, data: Partial<UsuarioOrmEntity>) {
    return this.usuarioRepo.update({ id_usuario: id }, data);
  }
  removeUsuario(id: string) {
    return this.usuarioRepo.delete({ id_usuario: id });
  }

  // ─── Credenciales (compartido, contraseñas/rol de login) ───
  findAllCredenciales() {
    return this.credencialRepo.find();
  }
  findOneCredencial(id: string) {
    return this.credencialRepo.findOneBy({ id_credencial: id });
  }
  createCredencial(data: Partial<CredencialOrmEntity>) {
    return this.credencialRepo.save(data);
  }
  updateCredencial(id: string, data: Partial<CredencialOrmEntity>) {
    return this.credencialRepo.update({ id_credencial: id }, data);
  }
  removeCredencial(id: string) {
    return this.credencialRepo.delete({ id_credencial: id });
  }

  // ─── Permisos ───
  async findAllPermisos() {
    return (await this.getRepo(PermisoOrmEntity)).find();
  }
  async findOnePermiso(id: string) {
    return (await this.getRepo(PermisoOrmEntity)).findOneBy({ id_permiso: id });
  }
  async createPermiso(data: Partial<PermisoOrmEntity>) {
    return (await this.getRepo(PermisoOrmEntity)).save(data);
  }
  async updatePermiso(id: string, data: Partial<PermisoOrmEntity>) {
    return (await this.getRepo(PermisoOrmEntity)).update({ id_permiso: id }, data);
  }
  async removePermiso(id: string) {
    return (await this.getRepo(PermisoOrmEntity)).delete({ id_permiso: id });
  }

  // ─── Accesos (compartido, log de acceso ligado a usuario/credencial) ───
  findAllAccesos() {
    return this.accesoRepo.find();
  }
  findOneAcceso(id: string) {
    return this.accesoRepo.findOneBy({ id_acceso: id });
  }
  createAcceso(data: Partial<AccesoOrmEntity>) {
    return this.accesoRepo.save(data);
  }
  updateAcceso(id: string, data: Partial<AccesoOrmEntity>) {
    return this.accesoRepo.update({ id_acceso: id }, data);
  }
  removeAcceso(id: string) {
    return this.accesoRepo.delete({ id_acceso: id });
  }
  getAccesos(limit?: number) {
    const options: FindManyOptions<AccesoOrmEntity> = {
      order: { fecha_ingreso: 'DESC' },
    };
    if (limit && limit > 0) {
      options.take = limit;
    }
    return this.accesoRepo.find(options);
  }
}
