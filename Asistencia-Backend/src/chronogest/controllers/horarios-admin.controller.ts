import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { HorariosAdminService } from '../services/horarios-admin.service';

@Controller('horarios-admin')
export class HorariosAdminController {
  constructor(private readonly horariosAdminService: HorariosAdminService) {}

  // ─── Administradores ───
  @Get('administradores')
  findAllAdmins() {
    return this.horariosAdminService.findAllAdmins();
  }

  @Post('administradores')
  createAdmin(@Body() body: any) {
    return this.horariosAdminService.createAdmin(body);
  }

  @Put('administradores/:id')
  updateAdmin(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.horariosAdminService.updateAdmin(id, body);
  }

  @Delete('administradores/:id')
  removeAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.horariosAdminService.removeAdmin(id);
  }

  // ─── Instructores ───
  @Get('instructores')
  findAllInstructores() {
    return this.horariosAdminService.findAllInstructores();
  }

  @Post('instructores')
  createInstructor(@Body() body: any) {
    return this.horariosAdminService.createInstructor(body);
  }

  @Put('instructores/:id')
  updateInstructor(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.horariosAdminService.updateInstructor(id, body);
  }

  @Delete('instructores/:id')
  removeInstructor(@Param('id', ParseUUIDPipe) id: string) {
    return this.horariosAdminService.removeInstructor(id);
  }

  // ─── Aprendices ───
  @Get('aprendices')
  findAllAprendices() {
    return this.horariosAdminService.findAllAprendices();
  }

  @Post('aprendices')
  createAprendiz(@Body() body: any) {
    return this.horariosAdminService.createAprendiz(body);
  }

  @Put('aprendices/:id')
  updateAprendiz(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.horariosAdminService.updateAprendiz(id, body);
  }

  @Delete('aprendices/:id')
  removeAprendiz(@Param('id', ParseUUIDPipe) id: string) {
    return this.horariosAdminService.removeAprendiz(id);
  }

  // ─── Fichas ───
  @Get('fichas')
  findAllFichas() {
    return this.horariosAdminService.findAllFichas();
  }

  @Post('fichas')
  createFicha(@Body() body: any) {
    return this.horariosAdminService.createFicha(body);
  }

  @Put('fichas/:id')
  updateFicha(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.horariosAdminService.updateFicha(id, body);
  }

  @Delete('fichas/:id')
  removeFicha(@Param('id', ParseUUIDPipe) id: string) {
    return this.horariosAdminService.removeFicha(id);
  }

  // ─── Ambientes ───
  @Get('ambientes')
  findAllAmbientes() {
    return this.horariosAdminService.findAllAmbientes();
  }

  @Post('ambientes')
  createAmbiente(@Body() body: any) {
    return this.horariosAdminService.createAmbiente(body);
  }

  @Put('ambientes/:id')
  updateAmbiente(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.horariosAdminService.updateAmbiente(id, body);
  }

  @Delete('ambientes/:id')
  removeAmbiente(@Param('id', ParseUUIDPipe) id: string) {
    return this.horariosAdminService.removeAmbiente(id);
  }

  // ─── Horarios ───
  @Get('horarios')
  findAllHorarios() {
    return this.horariosAdminService.findAllHorarios();
  }

  @Delete('horarios/:id')
  removeHorario(@Param('id', ParseUUIDPipe) id: string) {
    return this.horariosAdminService.removeHorario(id);
  }

  // ─── Competencias ───
  @Get('competencias')
  findAllCompetencias() {
    return this.horariosAdminService.findAllCompetencias();
  }

  @Delete('competencias/:id')
  removeCompetencia(@Param('id', ParseUUIDPipe) id: string) {
    return this.horariosAdminService.removeCompetencia(id);
  }

  // ─── Eventos ───
  @Get('eventos')
  findAllEventos() {
    return this.horariosAdminService.findAllEventos();
  }

  @Post('eventos')
  createEvento(@Body() body: any) {
    return this.horariosAdminService.createEvento(body);
  }

  @Put('eventos/:id')
  updateEvento(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.horariosAdminService.updateEvento(id, body);
  }

  @Delete('eventos/:id')
  removeEvento(@Param('id', ParseUUIDPipe) id: string) {
    return this.horariosAdminService.removeEvento(id);
  }

  // ─── Solicitudes ───
  @Get('solicitudes')
  findAllSolicitudes() {
    return this.horariosAdminService.findAllSolicitudes();
  }

  // ─── Notificaciones ───
  @Get('notificaciones')
  findAllNotificaciones() {
    return this.horariosAdminService.findAllNotificaciones();
  }

  @Delete('notificaciones/:id')
  removeNotificacion(@Param('id', ParseUUIDPipe) id: string) {
    return this.horariosAdminService.removeNotificacion(id);
  }

  // ─── Configuración ───
  @Get('configuracion')
  findAllConfiguracion() {
    return this.horariosAdminService.findAllConfiguracion();
  }

  @Put('configuracion/:id')
  updateConfiguracion(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.horariosAdminService.updateConfiguracion(id, body);
  }

  // ─── Opciones ───
  @Get('opts/fichas')
  findFichasOpts() {
    return this.horariosAdminService.findFichasOpts();
  }
}
