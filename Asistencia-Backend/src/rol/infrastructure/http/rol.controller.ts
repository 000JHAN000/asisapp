import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RolService } from '../../application/rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

import { Roles }     from 'src/auth/infrastructure/decorators/roles.decorator';
import { CheckTenant } from 'src/auth/infrastructure/guards/tenant.guard';

@CheckTenant()

@Controller('rol')
export class RolController {

  constructor(private readonly rolService: RolService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateRolDto) {
    return this.rolService.create(dto);
  }

  @Roles('admin')
  @Get()
  findAll(@Req() req) {
    return this.rolService.findAll(req.tenantId);
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRolDto) {
    return this.rolService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolService.remove(id);
  }
}