import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AmbienteService } from '../../application/ambiente.service';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { JwtGuard }  from 'src/auth/infrastructure/guards/jwt.guard';
import { RbacGuard } from 'src/auth/infrastructure/guards/rbac.guard';
import { Roles }     from 'src/auth/infrastructure/decorators/roles.decorator';

// @UseGuards(JwtGuard, RbacGuard)
@Controller('ambiente')
export class AmbienteController {

  constructor(private readonly ambienteService: AmbienteService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateAmbienteDto) {
    return this.ambienteService.create(dto);
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get()
  findAll() {
    return this.ambienteService.findAll();
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ambienteService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAmbienteDto) {
    return this.ambienteService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ambienteService.remove(id);
  }
}