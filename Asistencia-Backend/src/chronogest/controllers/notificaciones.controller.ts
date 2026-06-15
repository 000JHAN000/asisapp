import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificacionesService } from '../services/notificaciones.service';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  findByDestinatario(
    @Query('destinatarioId') destinatarioId?: string,
    @Query('destinatarioRol') destinatarioRol?: string,
  ) {
    return this.service.findByDestinatario(destinatarioId, destinatarioRol);
  }

  @Patch(':id/leer')
  marcarLeida(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.marcarLeida(id);
  }

  @Patch('leer-todas/rol')
  marcarTodasLeidas(@Query('destinatarioRol') destinatarioRol: string) {
    return this.service.marcarTodasLeidas(destinatarioRol);
  }
}
