import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../../application/auth.service';
import { LoginDto }    from './dto/login.dto';
import { JwtGuard }   from '../guards/jwt.guard';
import { Public }     from '../decorators/public.decorator';
import type { Request } from 'express';

@Controller('legacy-auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @Public()    
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  logout(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1]!;
    return this.authService.logout(token);
  }
}