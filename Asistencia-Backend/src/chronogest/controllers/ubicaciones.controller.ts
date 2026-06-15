import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UbicacionesService } from '../services/ubicaciones.service';

@Controller('ubicaciones')
export class UbicacionesController {
  constructor(private readonly service: UbicacionesService) {}

  @Get()
  findAll(@Query('tipo') tipo?: string) {
    if (tipo) return this.service.findByTipo(tipo);
    return this.service.findAll();
  }

  @Get('tipos')
  findTipos() {
    return this.service.findTipos();
  }

  @Get('disponibles-transversal')
  findDisponiblesTransversal(
    @Query('tipo') tipo?: string,
    @Query('dia') dia?: string,
    @Query('jornada') jornada?: string,
  ) {
    return this.service.findDisponiblesTransversal(tipo, dia, jornada);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
