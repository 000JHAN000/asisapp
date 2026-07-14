import { IsNotEmpty, IsString } from 'class-validator';

export class BotLoginDto {
  @IsNotEmpty()
  @IsString()
  telefono: string;

  @IsNotEmpty()
  @IsString()
  documento: string;
}
