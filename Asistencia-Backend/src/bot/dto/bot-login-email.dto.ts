import { IsNotEmpty, IsString } from 'class-validator';

export class BotLoginEmailDto {
  @IsNotEmpty()
  @IsString()
  telefono: string;

  // No se valida formato de correo aquí a propósito: si el usuario escribe mal el
  // correo, el flujo debe fallar con calidez en el paso de contraseña (encontrado:false)
  // en vez de devolver un 400 que rompa el nodo HTTP de n8n.
  @IsNotEmpty()
  @IsString()
  correo: string;
}
