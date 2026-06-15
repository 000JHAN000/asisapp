import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CentroFormacionService } from '../../application/centro-formacion.service';
import { CreateCentroFormacionDto } from './dto/create-centro-formacion.dto';
import { UpdateCentroFormacionDto } from './dto/update-centro-formacion.dto';
import { JwtGuard }  from 'src/auth/infrastructure/guards/jwt.guard';
import { RbacGuard } from 'src/auth/infrastructure/guards/rbac.guard';
import { Roles }     from 'src/auth/infrastructure/decorators/roles.decorator';

// @UseGuards(JwtGuard, RbacGuard)
@Controller('centro-formacion')
export class CentroFormacionController {

  constructor(private readonly centroFormacionService: CentroFormacionService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateCentroFormacionDto) {
    return this.centroFormacionService.create(dto);
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get()
  findAll() {
    return this.centroFormacionService.findAll();
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.centroFormacionService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCentroFormacionDto) {
    return this.centroFormacionService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.centroFormacionService.remove(id);
  }
}