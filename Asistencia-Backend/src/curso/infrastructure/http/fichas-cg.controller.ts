import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { FichasCGService } from 'src/curso/application/fichas-cg.service';

@Controller('fichas')
export class FichasCGController {
  constructor(private readonly fichasService: FichasCGService) {}

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
