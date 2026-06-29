import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ConfiguracionAsistenciaService } from '../../application/configuracion-asistencia.service';
import { CreateConfiguracionAsistenciaDto } from './dto/create-configuracion-asistencia.dto';
import { UpdateConfiguracionAsistenciaDto } from './dto/update-configuracion-asistencia.dto';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { CheckTenant } from 'src/auth/infrastructure/guards/tenant.guard';

/**
 * @deprecated Legacy: opera sobre `configuracion_asistencia` de `sena_db`.
 * El flujo facial actual no utiliza este recurso.
 */
@CheckTenant()
@Controller('configuracion-asistencia')
export class ConfiguracionAsistenciaController {

  constructor(private readonly service: ConfiguracionAsistenciaService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateConfiguracionAsistenciaDto) {
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

  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateConfiguracionAsistenciaDto) {
    return this.service.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
