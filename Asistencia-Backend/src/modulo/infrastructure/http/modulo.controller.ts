import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ModuloService } from '../../application/modulo.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { JwtGuard }  from 'src/auth/infrastructure/guards/jwt.guard';
import { RbacGuard } from 'src/auth/infrastructure/guards/rbac.guard';
import { Roles }     from 'src/auth/infrastructure/decorators/roles.decorator';
import { CheckTenant } from 'src/auth/infrastructure/guards/tenant.guard';

@CheckTenant()
// @UseGuards(JwtGuard, RbacGuard)
@Controller('modulo')
export class ModuloController {

  constructor(private readonly moduloService: ModuloService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateModuloDto) {
    return this.moduloService.create(dto);
  }

  @Roles('admin', 'instructor')
  @Get()
  findAll(@Req() req) {
    return this.moduloService.findAll(req.tenantId);
  }

  @Roles('admin', 'instructor')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.moduloService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateModuloDto) {
    return this.moduloService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.moduloService.remove(id);
  }
}