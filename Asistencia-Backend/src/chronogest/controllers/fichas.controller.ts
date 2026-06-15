import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { FichasService } from '../services/fichas.service';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';

@Controller('fichas')
export class FichasController {
  constructor(private readonly fichasService: FichasService) {}

  @Public()
  @Get()
  findAll() {
    return this.fichasService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.fichasService.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.fichasService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.fichasService.remove(id);
  }
}
