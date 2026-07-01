import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';

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

@Injectable()
export class FormativoCGService {
  constructor(
    @InjectRepository(CentroFormacionOrmEntity)
    private readonly centroRepo: Repository<CentroFormacionOrmEntity>,
    @InjectRepository(SedeOrmEntity)
    private readonly sedeRepo: Repository<SedeOrmEntity>,
    @InjectRepository(DepartamentoOrmEntity)
    private readonly departamentoRepo: Repository<DepartamentoOrmEntity>,
    @InjectRepository(MunicipioOrmEntity)
    private readonly municipioRepo: Repository<MunicipioOrmEntity>,
    @InjectRepository(AreaOrmEntity)
    private readonly areaRepo: Repository<AreaOrmEntity>,
    @InjectRepository(ProgramaOrmEntity)
    private readonly programaRepo: Repository<ProgramaOrmEntity>,
    @InjectRepository(PersonaOrmEntity)
    private readonly personaRepo: Repository<PersonaOrmEntity>,
    @InjectRepository(CursoOrmEntity)
    private readonly cursoRepo: Repository<CursoOrmEntity>,
    @InjectRepository(MatriculaOrmEntity)
    private readonly matriculaRepo: Repository<MatriculaOrmEntity>,
    @InjectRepository(AplicativoOrmEntity)
    private readonly aplicativoRepo: Repository<AplicativoOrmEntity>,
    @InjectRepository(ModuloOrmEntity)
    private readonly moduloRepo: Repository<ModuloOrmEntity>,
    @InjectRepository(ServicioOrmEntity)
    private readonly servicioRepo: Repository<ServicioOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @InjectRepository(CredencialOrmEntity)
    private readonly credencialRepo: Repository<CredencialOrmEntity>,
    @InjectRepository(PermisoOrmEntity)
    private readonly permisoRepo: Repository<PermisoOrmEntity>,
    @InjectRepository(AccesoOrmEntity)
    private readonly accesoRepo: Repository<AccesoOrmEntity>,
    @InjectRepository(RolOrmEntity)
    private readonly rolRepo: Repository<RolOrmEntity>,
    @InjectRepository(AmbienteOrmEntity)
    private readonly ambienteRepo: Repository<AmbienteOrmEntity>,
  ) {}

  // ─── Centros ───
  findAllCentros() {
    return this.centroRepo.find();
  }
  findOneCentro(id: string) {
    return this.centroRepo.findOneBy({ id_centro: id });
  }
  createCentro(data: Partial<CentroFormacionOrmEntity>) {
    return this.centroRepo.save(data);
  }
  updateCentro(id: string, data: Partial<CentroFormacionOrmEntity>) {
    return this.centroRepo.update({ id_centro: id }, data);
  }
  removeCentro(id: string) {
    return this.centroRepo.delete({ id_centro: id });
  }

  // ─── Sedes ───
  findAllSedes() {
    return this.sedeRepo.find();
  }
  findOneSede(id: string) {
    return this.sedeRepo.findOneBy({ id_sede: id });
  }
  createSede(data: Partial<SedeOrmEntity>) {
    return this.sedeRepo.save(data);
  }
  updateSede(id: string, data: Partial<SedeOrmEntity>) {
    return this.sedeRepo.update({ id_sede: id }, data);
  }
  removeSede(id: string) {
    return this.sedeRepo.delete({ id_sede: id });
  }

  // ─── Departamentos ───
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

  // ─── Municipios ───
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
  getAmbientesFormativo() {
    return this.ambienteRepo.find();
  }
  findAllAmbientes() {
    return this.ambienteRepo.find();
  }
  findOneAmbiente(id: string) {
    return this.ambienteRepo.findOneBy({ id_ambiente: id });
  }
  createAmbiente(data: Partial<AmbienteOrmEntity>) {
    return this.ambienteRepo.save(data);
  }
  updateAmbiente(id: string, data: Partial<AmbienteOrmEntity>) {
    return this.ambienteRepo.update({ id_ambiente: id }, data);
  }
  removeAmbiente(id: string) {
    return this.ambienteRepo.delete({ id_ambiente: id });
  }

  // ─── Áreas ───
  findAllAreas() {
    return this.areaRepo.find();
  }
  findOneArea(id: string) {
    return this.areaRepo.findOneBy({ id_area: id });
  }
  createArea(data: Partial<AreaOrmEntity>) {
    return this.areaRepo.save(data);
  }
  updateArea(id: string, data: Partial<AreaOrmEntity>) {
    return this.areaRepo.update({ id_area: id }, data);
  }
  removeArea(id: string) {
    return this.areaRepo.delete({ id_area: id });
  }

  // ─── Programas ───
  findAllProgramas() {
    return this.programaRepo.find();
  }
  findOnePrograma(id: string) {
    return this.programaRepo.findOneBy({ id_programa: id });
  }
  createPrograma(data: Partial<ProgramaOrmEntity>) {
    return this.programaRepo.save(data);
  }
  updatePrograma(id: string, data: Partial<ProgramaOrmEntity>) {
    return this.programaRepo.update({ id_programa: id }, data);
  }
  removePrograma(id: string) {
    return this.programaRepo.delete({ id_programa: id });
  }

  // ─── Personas ───
  findAllPersonas() {
    return this.personaRepo.find();
  }
  findOnePersona(id: string) {
    return this.personaRepo.findOneBy({ id_persona: id });
  }
  createPersona(data: Partial<PersonaOrmEntity>) {
    return this.personaRepo.save(data);
  }
  updatePersona(id: string, data: Partial<PersonaOrmEntity>) {
    return this.personaRepo.update({ id_persona: id }, data);
  }
  removePersona(id: string) {
    return this.personaRepo.delete({ id_persona: id });
  }

  // ─── Cursos ───
  findAllCursos() {
    return this.cursoRepo.find();
  }
  findOneCurso(id: string) {
    return this.cursoRepo.findOneBy({ id_curso: id });
  }
  createCurso(data: Partial<CursoOrmEntity>) {
    return this.cursoRepo.save(data);
  }
  updateCurso(id: string, data: Partial<CursoOrmEntity>) {
    return this.cursoRepo.update({ id_curso: id }, data);
  }
  removeCurso(id: string) {
    return this.cursoRepo.delete({ id_curso: id });
  }

  // ─── Matrículas ───
  findAllMatriculas() {
    return this.matriculaRepo.find();
  }
  findOneMatricula(id: string) {
    return this.matriculaRepo.findOneBy({ id_matricula: id });
  }
  createMatricula(data: Partial<MatriculaOrmEntity>) {
    return this.matriculaRepo.save(data);
  }
  updateMatricula(id: string, data: Partial<MatriculaOrmEntity>) {
    return this.matriculaRepo.update({ id_matricula: id }, data);
  }
  removeMatricula(id: string) {
    return this.matriculaRepo.delete({ id_matricula: id });
  }

  // ─── Aplicativos ───
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

  // ─── Roles ───
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
  findAllModulos() {
    return this.moduloRepo.find();
  }
  findOneModulo(id: string) {
    return this.moduloRepo.findOneBy({ id_modulo: id });
  }
  createModulo(data: Partial<ModuloOrmEntity>) {
    return this.moduloRepo.save(data);
  }
  updateModulo(id: string, data: Partial<ModuloOrmEntity>) {
    return this.moduloRepo.update({ id_modulo: id }, data);
  }
  removeModulo(id: string) {
    return this.moduloRepo.delete({ id_modulo: id });
  }

  // ─── Servicios ───
  findAllServicios() {
    return this.servicioRepo.find();
  }
  findOneServicio(id: string) {
    return this.servicioRepo.findOneBy({ id_servicio: id });
  }
  createServicio(data: Partial<ServicioOrmEntity>) {
    return this.servicioRepo.save(data);
  }
  updateServicio(id: string, data: Partial<ServicioOrmEntity>) {
    return this.servicioRepo.update({ id_servicio: id }, data);
  }
  removeServicio(id: string) {
    return this.servicioRepo.delete({ id_servicio: id });
  }

  // ─── Usuarios ───
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

  // ─── Credenciales ───
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
  findAllPermisos() {
    return this.permisoRepo.find();
  }
  findOnePermiso(id: string) {
    return this.permisoRepo.findOneBy({ id_permiso: id });
  }
  createPermiso(data: Partial<PermisoOrmEntity>) {
    return this.permisoRepo.save(data);
  }
  updatePermiso(id: string, data: Partial<PermisoOrmEntity>) {
    return this.permisoRepo.update({ id_permiso: id }, data);
  }
  removePermiso(id: string) {
    return this.permisoRepo.delete({ id_permiso: id });
  }

  // ─── Accesos ───
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
  async getAccesos(limit?: number) {
    const options: FindManyOptions<AccesoOrmEntity> = {
      order: { fecha_ingreso: 'DESC' },
    };
    if (limit && limit > 0) {
      options.take = limit;
    }
    return this.accesoRepo.find(options);
  }
}
