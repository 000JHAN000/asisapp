import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AccesoService } from '../../application/acceso.service';
import { CreateAccesoDto } from './dto/create-acceso.dto';
import { UpdateAccesoDto } from './dto/update-acceso.dto';
import { JwtGuard }  from 'src/auth/infrastructure/guards/jwt.guard';
import { RbacGuard } from 'src/auth/infrastructure/guards/rbac.guard';
import { Roles }     from 'src/auth/infrastructure/decorators/roles.decorator';
import { CheckTenant } from 'src/auth/infrastructure/guards/tenant.guard';

@CheckTenant()
// @UseGuards(JwtGuard, RbacGuard)
@Controller('acceso')
export class AccesoController {

  constructor(private readonly accesoService: AccesoService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateAccesoDto) {
    return this.accesoService.create(dto);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.accesoService.findAll();
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.accesoService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAccesoDto) {
    return this.accesoService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.accesoService.remove(id);
  }
}