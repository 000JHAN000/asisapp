import { Controller, Get } from '@nestjs/common';
import { AdministradoresService } from '../services/administradores.service';

@Controller('administradores')
export class AdministradoresController {
  constructor(private readonly administradoresService: AdministradoresService) {}

  @Get()
  findAll() {
    return this.administradoresService.findAll();
  }
}
