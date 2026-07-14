import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/** Protege endpoints llamados por el bot de n8n (sin JWT de usuario): exige un
 *  header x-bot-secret que coincida con BOT_API_KEY. Evita que cualquiera en
 *  internet pueda consultar asistencia de aprendices sin autorización. */
@Injectable()
export class BotApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-bot-secret'];
    const expected = process.env.BOT_API_KEY;
    if (!expected || secret !== expected) {
      throw new UnauthorizedException('Acceso no autorizado');
    }
    return true;
  }
}
