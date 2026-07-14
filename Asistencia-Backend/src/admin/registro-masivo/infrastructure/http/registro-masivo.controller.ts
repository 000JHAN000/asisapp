import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtGuard } from 'src/auth/infrastructure/guards/jwt.guard';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import {
  RegistroMasivoService,
  RegistroMasivoResultado,
} from '../../application/registro-masivo.service';
import type { TipoRegistroMasivo } from '../../application/registro-masivo.service';

@Controller('admin')
@UseGuards(JwtGuard)
export class RegistroMasivoController {
  constructor(private readonly registroMasivoService: RegistroMasivoService) {}

  @Post('registro-masivo')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async procesar(
    @UploadedFile() file: any,
    @Query('tipo') tipo: TipoRegistroMasivo,
    @Req() req: Request & { user: any },
  ): Promise<RegistroMasivoResultado> {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    if (!tipo || (tipo !== 'aprendices' && tipo !== 'instructores')) {
      throw new BadRequestException("El query param 'tipo' debe ser 'aprendices' o 'instructores'");
    }

    const tenantSlug = req.user?.tenantSlug;
    if (!tenantSlug) {
      throw new BadRequestException('El usuario no tiene una sede asignada');
    }

    return this.registroMasivoService.procesar(file.buffer, tipo, tenantSlug);
  }
}
