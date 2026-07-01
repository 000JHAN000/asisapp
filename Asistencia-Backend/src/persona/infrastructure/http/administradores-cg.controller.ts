import { Controller, Get } from '@nestjs/common';
import { AdministradoresCGService } from 'src/persona/application/administradores-cg.service';

@Controller('administradores')
export class AdministradoresCGController {
  constructor(private readonly administradoresService: AdministradoresCGService) {}

  @Get()
  findAll() {
    return this.administradoresService.findAll();
  }
}
