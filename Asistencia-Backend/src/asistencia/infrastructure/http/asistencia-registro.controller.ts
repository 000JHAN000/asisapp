import { Body, Controller, Patch, Post, Req } from '@nestjs/common';
import { AsistenciaRegistroService } from '../../application/asistencia-registro.service';
import { CreateAsistenciaRegistroDto } from './dto/create-asistencia-registro.dto';
import { MarcarFallaDto } from './dto/marcar-falla.dto';
import { VerificarRostroDto } from './dto/verificar-rostro.dto';
import { emitFirma } from './asistencia-sesion.controller';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { normalizeIp } from 'src/infrastructure/utils/ip.util';

@Controller('asistencia/registros')
export class AsistenciaRegistroController {
  constructor(private readonly registroService: AsistenciaRegistroService) {}

  @Roles('aprendiz', 'admin')
  @Post('verificar-rostro')
  async verificarRostro(@Body() dto: VerificarRostroDto, @Req() req: any) {
    if (req.user && req.user.perfilId) {
      dto.aprendizId = req.user.perfilId;
    }
    if (req.user && req.user.documento) {
      dto.documento = req.user.documento;
    }
    return this.registroService.verificarRostro(dto);
  }

  @Roles('aprendiz', 'admin')
  @Post('firma')
  async registrarFirma(@Body() dto: CreateAsistenciaRegistroDto, @Req() req: any) {
    if (req.user && req.user.perfilId) {
      dto.aprendizId = req.user.perfilId;
    }
    if (req.user && req.user.documento) {
      dto.documento = req.user.documento;
    }
    // La IP del cliente no debe depender de un servicio externo (api.ipify.org):
    // la tomamos directamente de la conexión/cabecera del proxy y la normalizamos
    // a IPv4 (por ej. ::ffff:192.168.1.1 -> 192.168.1.1).
    const forwarded = req.headers['x-forwarded-for'];
    const rawIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined)
      || req.ip
      || req.socket?.remoteAddress
      || dto.ipAddress;
    dto.ipAddress = normalizeIp(rawIp);
    const registro = await this.registroService.registrarFirma(dto);
    console.log('[SSE] Emitiendo firma para sesión:', dto.sesionId, 'aprendiz:', dto.aprendizId);
    emitFirma(dto.sesionId, registro);
    return registro;
  }

  @Roles('instructor', 'admin')
  @Patch('falla-justificada')
  marcarFalla(@Body() dto: MarcarFallaDto) {
    return this.registroService.marcarFallaJustificada(dto);
  }
}
