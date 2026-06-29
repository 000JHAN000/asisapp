import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '../../auth/infrastructure/decorators/public.decorator';
import { SuperAdminAuthService } from '../services/super-admin-auth.service';

@Controller('super-admin/auth')
export class SuperAdminAuthController {
  constructor(private readonly authService: SuperAdminAuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: { identifier: string; password: string }) {
    return this.authService.login(body.identifier, body.password);
  }
}
