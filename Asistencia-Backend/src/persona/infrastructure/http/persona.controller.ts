import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { PersonaService } from '../../application/persona.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { JwtGuard }  from 'src/auth/infrastructure/guards/jwt.guard';
import { RbacGuard } from 'src/auth/infrastructure/guards/rbac.guard';
import { Roles }     from 'src/auth/infrastructure/decorators/roles.decorator';

// @UseGuards(JwtGuard, RbacGuard)
@Controller('persona')
export class PersonaController {

  constructor(private readonly personaService: PersonaService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreatePersonaDto) {
    return this.personaService.create(dto);
  }

  @Roles('admin', 'instructor')
  @Get()
  findAll() {
    return this.personaService.findAll();
  }

  @Roles('admin', 'instructor', 'aprendiz')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.personaService.findOne(id);
  }

  @Roles('admin', 'instructor')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePersonaDto) {
    return this.personaService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.personaService.remove(id);
  }
}