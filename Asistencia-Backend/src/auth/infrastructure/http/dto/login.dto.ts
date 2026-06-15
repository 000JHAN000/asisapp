import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  login: string;

  @IsString()
  @MinLength(4)
  @MaxLength(100)
  password: string;
}