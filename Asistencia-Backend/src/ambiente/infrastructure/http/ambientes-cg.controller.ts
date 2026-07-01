import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { AmbientesCGService } from 'src/ambiente/application/ambientes-cg.service';

@Controller('ambientes')
export class AmbientesCGController {
  constructor(private readonly ambientesService: AmbientesCGService) {}

  @Get()
  findAll() {
    return this.ambientesService.findAll();
  }

  @Get('disponibilidad')
  disponibilidad(@Query('dia') dia: string, @Query('jornada') jornada: string) {
    return this.ambientesService.findDisponibilidad(dia, jornada);
  }

  @Get('libres-ahora')
  libresAhora() {
    return this.ambientesService.findLibresAhora();
  }

  @Post()
  create(@Body() body: any) {
    return this.ambientesService.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.ambientesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ambientesService.remove(id);
  }
}
