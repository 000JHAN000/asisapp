import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { FormacionAsistenciaService } from '../../application/formacion-asistencia.service';
import { CreateFormacionAsistenciaDto } from './dto/create-formacion-asistencia.dto';
import { UpdateFormacionAsistenciaDto } from './dto/update-formacion-asistencia.dto';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { CheckTenant } from 'src/auth/infrastructure/guards/tenant.guard';

@CheckTenant()
@Controller('formacion-asistencia')
export class FormacionAsistenciaController {

  constructor(private readonly service: FormacionAsistenciaService) {}

  @Roles('admin', 'instructor')
  @Post()
  create(@Body() dto: CreateFormacionAsistenciaDto) {
    return this.service.create(dto);
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin', 'instructor')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFormacionAsistenciaDto) {
    return this.service.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
