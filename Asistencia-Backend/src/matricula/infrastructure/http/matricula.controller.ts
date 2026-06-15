import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MatriculaService } from '../../application/matricula.service';
import { CreateMatriculaDto } from './dto/create-matricula.dto';
import { UpdateMatriculaDto } from './dto/update-matricula.dto';
import { JwtGuard }  from 'src/auth/infrastructure/guards/jwt.guard';
import { RbacGuard } from 'src/auth/infrastructure/guards/rbac.guard';
import { Roles }     from 'src/auth/infrastructure/decorators/roles.decorator';
import { CheckTenant } from 'src/auth/infrastructure/guards/tenant.guard';

@CheckTenant()
// @UseGuards(JwtGuard, RbacGuard)
@Controller('matricula')
export class MatriculaController {

  constructor(private readonly matriculaService: MatriculaService) {}

  @Roles('admin', 'instructor')
  @Post()
  create(@Body() dto: CreateMatriculaDto) {
    return this.matriculaService.create(dto);
  }

  @Roles('admin', 'instructor')
  @Get()
  findAll(@Query('curso_fk') cursoFk?: string) {
  return this.matriculaService.findAll(cursoFk);
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.matriculaService.findOne(id);
  }

  @Roles('admin', 'instructor')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMatriculaDto) {
    return this.matriculaService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.matriculaService.remove(id);
  }
}