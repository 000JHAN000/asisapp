import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ServicioService } from '../../application/servicio.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { JwtGuard }  from 'src/auth/infrastructure/guards/jwt.guard';
import { RbacGuard } from 'src/auth/infrastructure/guards/rbac.guard';
import { Roles }     from 'src/auth/infrastructure/decorators/roles.decorator';
import { CheckTenant } from 'src/auth/infrastructure/guards/tenant.guard';

@CheckTenant()
// @UseGuards(JwtGuard, RbacGuard)
@Controller('servicio')
export class ServicioController {

  constructor(private readonly servicioService: ServicioService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateServicioDto) {
    return this.servicioService.create(dto);
  }

  @Roles('admin', 'instructor')
  @Get()
  findAll() {
    return this.servicioService.findAll();
  }

  @Roles('admin', 'instructor')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicioService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServicioDto) {
    return this.servicioService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicioService.remove(id);
  }
}