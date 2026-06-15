import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { AsistenciaService } from '../../application/asistencia.service';
import { AsistenciaProducer } from 'src/queues/producers/asistencia.producer';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { CheckTenant } from 'src/auth/infrastructure/guards/tenant.guard';

@CheckTenant()
@Controller('asistencia')
export class AsistenciaController {

  constructor(
    private readonly asistenciaService: AsistenciaService,
    private readonly asistenciaProducer: AsistenciaProducer,
  ) {}

  @Roles('admin', 'instructor', 'aprendiz')
  @Post()
  async create(@Body() dto: CreateAsistenciaDto) {
    await this.asistenciaProducer.registrar(dto);
    return { message: 'Asistencia encolada correctamente' };
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get()
  findAll() {
    return this.asistenciaService.findAll();
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.asistenciaService.findOne(id);
  }

  @Roles('admin', 'instructor')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAsistenciaDto) {
    return this.asistenciaService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.asistenciaService.remove(id);
  }
}
