import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ConfiguracionService } from '../services/configuracion.service';

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly service: ConfiguracionService) {}

  @Get()
  find() {
    return this.service.find();
  }

  @Patch('pin')
  updatePin(@Body() body: { pin: string }) {
    return this.service.updatePin(body.pin);
  }
}
