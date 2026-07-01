import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SolicitudesCGService } from 'src/aplicativo/application/solicitudes-cg.service';

@Controller('solicitudes-cambio')
export class SolicitudesCGController {
  constructor(private readonly service: SolicitudesCGService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('instructor/:id')
  findByInstructor(@Param('id') id: string) {
    return this.service.findByInstructor(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id/responder')
  responder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      estado: 'aprobada' | 'rechazada';
      respuestaAdmin?: string;
    },
  ) {
    return this.service.responder(id, body.estado, body.respuestaAdmin);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancelar(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Get('pendientes/count')
  countPendientes() {
    return this.service.countPendientes();
  }
}
