import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ConfiguracionCGService } from 'src/aplicativo/application/configuracion-cg.service';

@Controller('configuracion')
export class ConfiguracionCGController {
  constructor(private readonly service: ConfiguracionCGService) {}

  @Get()
  find() {
    return this.service.find();
  }

  @Patch('pin')
  updatePin(@Body() body: { pin: string }) {
    return this.service.updatePin(body.pin);
  }
}
