import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthCGService } from '../services/auth-cg.service';
import { JwtGuard } from 'src/auth/infrastructure/guards/jwt.guard';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';

@Controller('auth')
export class AuthCGController {
  constructor(private readonly authService: AuthCGService) {}

  @Public()
  @Post('login')
  login(@Body() body: { identifier: string; password: string }) {
    return this.authService.login(body.identifier, body.password);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  logout(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1] ?? '';
    return this.authService.logout(token);
  }

  @Public()
  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Public()
  @Post('verify-pin')
  verifyPin(@Body() body: { pin: string }) {
    return this.authService.verifyPin(body.pin);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() body: any) {
    return this.authService.forgotPassword(body);
  }

  @Public()
  @Post('verify-reset-code')
  verifyResetCode(@Body() body: any) {
    return this.authService.verifyResetCode(body);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.authService.me(req.user.sub);
  }
}
