import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AprendicesService } from '../services/aprendices.service';
import { JwtGuard } from 'src/auth/infrastructure/guards/jwt.guard';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';

@Controller('aprendices')
export class AprendicesController {
  constructor(private readonly aprendicesService: AprendicesService) {}

  @Get()
  findAll() {
    return this.aprendicesService.findAll();
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.aprendicesService.update(id, body);
  }

  @UseGuards(JwtGuard)
  @Roles('aprendiz', 'admin')
  @Get('me/face-status')
  async getMyFaceStatus(@Req() req: any) {
    const documento = req.user.documento;
    return this.aprendicesService.getFaceStatus(documento);
  }

  @UseGuards(JwtGuard)
  @Roles('aprendiz', 'admin')
  @Post('me/register-face')
  async registerMyFace(@Req() req: any, @Body() body: { image: string }) {
    const documento = req.user.documento;
    return this.aprendicesService.registerFace(documento, body.image);
  }
}
