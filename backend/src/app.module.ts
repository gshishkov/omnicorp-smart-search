import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ChatModule } from './chat/chat.module';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { DocumentsModule } from './documents/documents.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => [{ ttl: 60_000, limit: config.get('CHAT_RATE_LIMIT_PER_MIN') }],
    }),
    DocumentsModule,
    ChatModule,
    HealthModule,
  ],
})
export class AppModule {}
