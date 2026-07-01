import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { FormativoCGService } from 'src/aplicativo/application/formativo-cg.service';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';

@Controller('formativo')
export class FormativoCGController {
  constructor(private readonly formativoService: FormativoCGService) {}

  // ─── Centros ───
  @Get('centros')
  findAllCentros() {
    return this.formativoService.findAllCentros();
  }

  @Post('centros')
  createCentro(@Body() body: any) {
    return this.formativoService.createCentro(body);
  }

  @Put('centros/:id')
  updateCentro(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateCentro(id, body);
  }

  @Delete('centros/:id')
  removeCentro(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeCentro(id);
  }

  // ─── Sedes ───
  @Get('sedes')
  findAllSedes() {
    return this.formativoService.findAllSedes();
  }

  @Post('sedes')
  createSede(@Body() body: any) {
    return this.formativoService.createSede(body);
  }

  @Put('sedes/:id')
  updateSede(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateSede(id, body);
  }

  @Delete('sedes/:id')
  removeSede(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeSede(id);
  }

  // ─── Departamentos ───
  @Public()
  @Get('departamentos')
  findAllDepartamentos() {
    return this.formativoService.findAllDepartamentos();
  }

  @Post('departamentos')
  createDepartamento(@Body() body: any) {
    return this.formativoService.createDepartamento(body);
  }

  @Put('departamentos/:id')
  updateDepartamento(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateDepartamento(id, body);
  }

  @Delete('departamentos/:id')
  removeDepartamento(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeDepartamento(id);
  }

  // ─── Municipios ───
  @Public()
  @Get('municipios')
  findAllMunicipios() {
    return this.formativoService.findAllMunicipios();
  }

  @Post('municipios')
  createMunicipio(@Body() body: any) {
    return this.formativoService.createMunicipio(body);
  }

  @Put('municipios/:id')
  updateMunicipio(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateMunicipio(id, body);
  }

  @Delete('municipios/:id')
  removeMunicipio(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeMunicipio(id);
  }

  // ─── Ambientes ───
  @Get('ambientes')
  findAllAmbientes() {
    return this.formativoService.findAllAmbientes();
  }

  @Post('ambientes')
  createAmbiente(@Body() body: any) {
    return this.formativoService.createAmbiente(body);
  }

  @Put('ambientes/:id')
  updateAmbiente(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateAmbiente(id, body);
  }

  @Delete('ambientes/:id')
  removeAmbiente(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeAmbiente(id);
  }

  // ─── Áreas ───
  @Get('areas')
  findAllAreas() {
    return this.formativoService.findAllAreas();
  }

  @Post('areas')
  createArea(@Body() body: any) {
    return this.formativoService.createArea(body);
  }

  @Put('areas/:id')
  updateArea(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateArea(id, body);
  }

  @Delete('areas/:id')
  removeArea(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeArea(id);
  }

  // ─── Programas ───
  @Get('programas')
  findAllProgramas() {
    return this.formativoService.findAllProgramas();
  }

  @Post('programas')
  createPrograma(@Body() body: any) {
    return this.formativoService.createPrograma(body);
  }

  @Put('programas/:id')
  updatePrograma(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updatePrograma(id, body);
  }

  @Delete('programas/:id')
  removePrograma(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removePrograma(id);
  }

  // ─── Personas ───
  @Get('personas')
  findAllPersonas() {
    return this.formativoService.findAllPersonas();
  }

  @Post('personas')
  createPersona(@Body() body: any) {
    return this.formativoService.createPersona(body);
  }

  @Put('personas/:id')
  updatePersona(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updatePersona(id, body);
  }

  @Delete('personas/:id')
  removePersona(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removePersona(id);
  }

  // ─── Cursos ───
  @Get('cursos')
  findAllCursos() {
    return this.formativoService.findAllCursos();
  }

  @Post('cursos')
  createCurso(@Body() body: any) {
    return this.formativoService.createCurso(body);
  }

  @Put('cursos/:id')
  updateCurso(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateCurso(id, body);
  }

  @Delete('cursos/:id')
  removeCurso(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeCurso(id);
  }

  // ─── Matrículas ───
  @Get('matriculas')
  findAllMatriculas() {
    return this.formativoService.findAllMatriculas();
  }

  @Post('matriculas')
  createMatricula(@Body() body: any) {
    return this.formativoService.createMatricula(body);
  }

  @Put('matriculas/:id')
  updateMatricula(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateMatricula(id, body);
  }

  @Delete('matriculas/:id')
  removeMatricula(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeMatricula(id);
  }

  // ─── Aplicativos ───
  @Get('aplicativos')
  findAllAplicativos() {
    return this.formativoService.findAllAplicativos();
  }

  @Post('aplicativos')
  createAplicativo(@Body() body: any) {
    return this.formativoService.createAplicativo(body);
  }

  @Put('aplicativos/:id')
  updateAplicativo(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateAplicativo(id, body);
  }

  @Delete('aplicativos/:id')
  removeAplicativo(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeAplicativo(id);
  }

  // ─── Roles ───
  @Get('roles')
  findAllRoles() {
    return this.formativoService.findAllRoles();
  }

  @Post('roles')
  createRol(@Body() body: any) {
    return this.formativoService.createRol(body);
  }

  @Put('roles/:id')
  updateRol(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateRol(id, body);
  }

  @Delete('roles/:id')
  removeRol(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeRol(id);
  }

  // ─── Módulos ───
  @Get('modulos')
  findAllModulos() {
    return this.formativoService.findAllModulos();
  }

  @Post('modulos')
  createModulo(@Body() body: any) {
    return this.formativoService.createModulo(body);
  }

  @Put('modulos/:id')
  updateModulo(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateModulo(id, body);
  }

  @Delete('modulos/:id')
  removeModulo(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeModulo(id);
  }

  // ─── Servicios ───
  @Get('servicios')
  findAllServicios() {
    return this.formativoService.findAllServicios();
  }

  @Post('servicios')
  createServicio(@Body() body: any) {
    return this.formativoService.createServicio(body);
  }

  @Put('servicios/:id')
  updateServicio(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateServicio(id, body);
  }

  @Delete('servicios/:id')
  removeServicio(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeServicio(id);
  }

  // ─── Usuarios ───
  @Get('usuarios')
  findAllUsuarios() {
    return this.formativoService.findAllUsuarios();
  }

  @Post('usuarios')
  createUsuario(@Body() body: any) {
    return this.formativoService.createUsuario(body);
  }

  @Put('usuarios/:id')
  updateUsuario(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateUsuario(id, body);
  }

  @Delete('usuarios/:id')
  removeUsuario(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeUsuario(id);
  }

  // ─── Credenciales ───
  @Get('credenciales')
  findAllCredenciales() {
    return this.formativoService.findAllCredenciales();
  }

  @Post('credenciales')
  createCredencial(@Body() body: any) {
    return this.formativoService.createCredencial(body);
  }

  @Put('credenciales/:id')
  updateCredencial(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updateCredencial(id, body);
  }

  @Delete('credenciales/:id')
  removeCredencial(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removeCredencial(id);
  }

  // ─── Permisos ───
  @Get('permisos')
  findAllPermisos() {
    return this.formativoService.findAllPermisos();
  }

  @Post('permisos')
  createPermiso(@Body() body: any) {
    return this.formativoService.createPermiso(body);
  }

  @Put('permisos/:id')
  updatePermiso(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.formativoService.updatePermiso(id, body);
  }

  @Delete('permisos/:id')
  removePermiso(@Param('id', ParseUUIDPipe) id: string) {
    return this.formativoService.removePermiso(id);
  }

  // ─── Accesos ───
  @Get('accesos')
  findAllAccesos(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.formativoService.getAccesos(parsedLimit);
  }
}
