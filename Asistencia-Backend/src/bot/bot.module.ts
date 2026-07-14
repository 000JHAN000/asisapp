import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { TenantModule } from '../auth/infrastructure/persistence/tenants/tenant.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule {}
