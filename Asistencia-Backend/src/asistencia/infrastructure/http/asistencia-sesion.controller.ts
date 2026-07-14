import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
  MessageEvent,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { AsistenciaSesionService } from '../../application/asistencia-sesion.service';
import { CreateAsistenciaSesionDto } from './dto/create-asistencia-sesion.dto';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';
import { BotApiKeyGuard } from '../guards/bot-api-key.guard';

// Event emitter global simple para SSE
const sseSubjects = new Map<string, Subject<MessageEvent>>();

export function emitFirma(sesionId: string, registro: any) {
  const sub = sseSubjects.get(sesionId);
  if (sub) {
    sub.next({ data: { type: 'firma', registro } } as MessageEvent);
  }
}

@Controller('asistencia')
export class AsistenciaSesionController {
  constructor(private readonly sesionService: AsistenciaSesionService) {}

  // ── Sesiones ─────────────────────────────────────────────────────

  @Roles('instructor', 'admin')
  @Post('sesiones')
  async create(@Body() dto: CreateAsistenciaSesionDto, @Req() req: any) {
    const instructorId = req.user.perfilId || req.user.sub;
    return this.sesionService.create(dto, instructorId);
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get('sesiones/horario/:horarioId/activa')
  findActivaByHorario(@Param('horarioId', ParseUUIDPipe) horarioId: string) {
    return this.sesionService.findActivaByHorario(horarioId);
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get('sesiones/:id/pendientes')
  async getPendientes(@Param('id', ParseUUIDPipe) id: string) {
    return this.sesionService.getPendientes(id);
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get('sesiones/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sesionService.findById(id);
  }

  @Roles('instructor', 'admin')
  @Patch('sesiones/:id/cerrar')
  cerrar(@Param('id', ParseUUIDPipe) id: string) {
    return this.sesionService.cerrar(id);
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Sse('sesiones/:id/stream')
  stream(@Param('id', ParseUUIDPipe) id: string): Observable<MessageEvent> {
    const sub = new Subject<MessageEvent>();
    sseSubjects.set(id, sub);
    // Cleanup después de 2 horas
    setTimeout(() => {
      sub.complete();
      sseSubjects.delete(id);
    }, 2 * 60 * 60 * 1000);
    return sub.asObservable();
  }

  // ── Consultas por instructor / ficha ─────────────────────────────

  @Roles('admin')
  @Get('historial')
  getHistorial(
    @Query('fecha') fecha?: string,
    @Query('fichaId') fichaId?: string,
    @Query('instructorId') instructorId?: string,
  ) {
    return this.sesionService.getHistorial({ fecha, fichaId, instructorId });
  }

  @Roles('admin', 'instructor')
  @Get('instructor/:id/activas')
  findActivasByInstructor(@Param('id', ParseUUIDPipe) id: string) {
    return this.sesionService.findActivasByInstructor(id);
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get('ficha/:id/activa')
  findActivaByFicha(@Param('id', ParseUUIDPipe) id: string) {
    return this.sesionService.findActivaByFicha(id);
  }

  @Roles('aprendiz', 'admin')
  @Get('ficha/:id/mis-sesiones')
  misSesiones(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const aprendizId = req.user.perfilId || req.user.sub;
    return this.sesionService.misSesionesRecientes(id, aprendizId);
  }

  // ── Consulta para el bot (n8n) ────────────────────────────────────
  // Sin JWT de usuario (llamado servidor-a-servidor desde n8n); protegido
  // por un header x-bot-secret en vez de la sesión normal de la app.
  @Public()
  @UseGuards(BotApiKeyGuard)
  @Get('registros/consulta/:identificador')
  consultarParaBot(@Param('identificador') identificador: string) {
    return this.sesionService.consultarPorIdentificador(identificador);
  }

  @Public()
  @UseGuards(BotApiKeyGuard)
  @Get('horario/consulta/:identificador')
  consultarHorarioParaBot(@Param('identificador') identificador: string) {
    return this.sesionService.consultarHorarioPorIdentificador(identificador);
  }

  @Roles('admin', 'instructor')
  @Get('ficha/:id/reporte-mensual')
  getReporteMensual(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('anio') anio: string,
    @Query('mes') mes: string,
  ) {
    return this.sesionService.getReporteMensual(id, parseInt(anio, 10), parseInt(mes, 10));
  }
}
