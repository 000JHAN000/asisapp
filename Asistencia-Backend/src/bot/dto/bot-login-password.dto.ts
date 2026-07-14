import { IsNotEmpty, IsString } from 'class-validator';

export class BotLoginPasswordDto {
  @IsNotEmpty()
  @IsString()
  telefono: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
