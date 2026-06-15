import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { HorariosService } from '../services/horarios.service';

@Controller('horarios')
export class HorariosController {
  constructor(private readonly service: HorariosService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('by-instructor/:id')
  findByInstructor(@Param('id') id: string) {
    return this.service.findByInstructor(id);
  }

  @Get('by-ficha/:id')
  findByFicha(@Param('id') id: string) {
    return this.service.findByFicha(id);
  }

  @Get('by-ambiente/:id')
  findByAmbiente(@Param('id') id: string) {
    return this.service.findByAmbiente(id);
  }

  @Post()
  create(@Body() body: any) {
    const data = body.dias ? body.dias : body;
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.toggle(id);
  }

  @Patch(':id/play')
  play(@Param('id', ParseUUIDPipe) id: string, @Body() body?: any) {
    return this.service.play(id, body);
  }

  @Patch(':id/finalizar')
  finalizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: { motivo?: string },
  ) {
    return this.service.finalizar(id, body?.motivo);
  }

  @Patch(':id/finalizar-transversal')
  finalizarTransversal(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.finalizarTransversal(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }
}
