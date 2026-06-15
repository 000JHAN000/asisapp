import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { AsistenciaSesionService } from '../../application/asistencia-sesion.service';
import { CreateAsistenciaSesionDto } from './dto/create-asistencia-sesion.dto';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';

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
}
