import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CompetenciasCGService } from 'src/modulo/application/competencias-cg.service';

@Controller('competencias')
export class CompetenciasCGController {
  constructor(private readonly service: CompetenciasCGService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('horario/:id')
  findByHorario(@Param('id') id: string) {
    return this.service.findByHorario(id);
  }

  @Get('instructor/:id')
  findByInstructor(@Param('id') id: string) {
    return this.service.findByInstructor(id);
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
