import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { PermisoService } from '../../application/permiso.service';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';
import { JwtGuard }  from 'src/auth/infrastructure/guards/jwt.guard';
import { RbacGuard } from 'src/auth/infrastructure/guards/rbac.guard';
import { Roles }     from 'src/auth/infrastructure/decorators/roles.decorator';
import { CheckTenant } from 'src/auth/infrastructure/guards/tenant.guard';

@CheckTenant()
// @UseGuards(JwtGuard, RbacGuard)
@Controller('permiso')
export class PermisoController {

  constructor(private readonly permisoService: PermisoService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreatePermisoDto) {
    return this.permisoService.create(dto);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.permisoService.findAll();
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisoService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePermisoDto) {
    return this.permisoService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisoService.remove(id);
  }
}