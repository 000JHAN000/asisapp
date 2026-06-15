import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AplicativoService } from '../../application/aplicativo.service';
import { CreateAplicativoDto } from './dto/create-aplicativo.dto';
import { UpdateAplicativoDto } from './dto/update-aplicativo.dto';
import { JwtGuard }  from 'src/auth/infrastructure/guards/jwt.guard';
import { RbacGuard } from 'src/auth/infrastructure/guards/rbac.guard';
import { Roles }     from 'src/auth/infrastructure/decorators/roles.decorator';

// @UseGuards(JwtGuard, RbacGuard)
@Controller('aplicativo')
export class AplicativoController {

  constructor(private readonly aplicativoService: AplicativoService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateAplicativoDto) {
    return this.aplicativoService.create(dto);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.aplicativoService.findAll();
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.aplicativoService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAplicativoDto) {
    return this.aplicativoService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.aplicativoService.remove(id);
  }
}