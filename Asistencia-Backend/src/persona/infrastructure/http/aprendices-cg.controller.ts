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
import { AprendicesCGService } from 'src/persona/application/aprendices-cg.service';
import { JwtGuard } from 'src/auth/infrastructure/guards/jwt.guard';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';

@Controller('aprendices')
export class AprendicesCGController {
  constructor(private readonly aprendicesService: AprendicesCGService) {}

  @UseGuards(JwtGuard)
  @Roles('admin', 'instructor')
  @Get()
  findAll() {
    return this.aprendicesService.findAll();
  }

  @UseGuards(JwtGuard)
  @Roles('admin')
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
