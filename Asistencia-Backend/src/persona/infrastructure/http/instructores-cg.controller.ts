import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Put } from '@nestjs/common';
import { InstructoresCGService } from 'src/persona/application/instructores-cg.service';

@Controller('instructores')
export class InstructoresCGController {
  constructor(private readonly instructoresService: InstructoresCGService) {}

  @Get()
  findAll() {
    return this.instructoresService.findAll();
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.instructoresService.update(id, body);
  }

  @Patch(':id/lider')
  setLider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { esLider: boolean; areaLiderada?: string },
  ) {
    return this.instructoresService.setLider(id, body.esLider, body.areaLiderada);
  }

  @Patch(':id/transversal')
  setTransversal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { esTransversal: boolean },
  ) {
    return this.instructoresService.setTransversal(id, body.esTransversal);
  }

  @Get('stats')
  getStats() {
    return this.instructoresService.getStats();
  }
}
