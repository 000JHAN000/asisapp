import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AreaService } from '../../application/area.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { JwtGuard }  from 'src/auth/infrastructure/guards/jwt.guard';
import { RbacGuard } from 'src/auth/infrastructure/guards/rbac.guard';
import { Roles }     from 'src/auth/infrastructure/decorators/roles.decorator';
import { CheckTenant } from 'src/auth/infrastructure/guards/tenant.guard';

@CheckTenant()
// @UseGuards(JwtGuard, RbacGuard)
@Controller('area')
export class AreaController {

  constructor(private readonly areaService: AreaService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateAreaDto) {
    return this.areaService.create(dto);
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get()
  findAll() {
    return this.areaService.findAll();
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.areaService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAreaDto) {
    return this.areaService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.areaService.remove(id);
  }
}