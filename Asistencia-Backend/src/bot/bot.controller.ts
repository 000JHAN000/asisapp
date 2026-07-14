import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotLoginDto } from './dto/bot-login.dto';
import { BotLoginEmailDto } from './dto/bot-login-email.dto';
import { BotLoginPasswordDto } from './dto/bot-login-password.dto';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';
import { BotApiKeyGuard } from '../asistencia/infrastructure/guards/bot-api-key.guard';

// Endpoints llamados por n8n (servidor-a-servidor, sin JWT de usuario) para el bot de
// WhatsApp: protegidos por x-bot-secret en vez de la sesión normal de la app.
@Controller('bot')
@Public()
@UseGuards(BotApiKeyGuard)
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Get('session/:telefono')
  async obtenerSesion(@Param('telefono') telefono: string) {
    return this.botService.obtenerEstado(telefono);
  }

  // Login legado por documento (ya no lo usa el flujo de WhatsApp, se deja por compatibilidad).
  @Post('login')
  async login(@Body() dto: BotLoginDto) {
    return this.botService.iniciarSesion(dto.telefono, dto.documento);
  }

  // Paso 1: el usuario envía su correo.
  @Post('login/email')
  async loginEmail(@Body() dto: BotLoginEmailDto) {
    return this.botService.guardarCorreoPendiente(dto.telefono, dto.correo);
  }

  // Paso 2: el usuario envía su contraseña; se valida igual que el login web.
  @Post('login/password')
  async loginPassword(@Body() dto: BotLoginPasswordDto) {
    return this.botService.validarPassword(dto.telefono, dto.password);
  }
}
