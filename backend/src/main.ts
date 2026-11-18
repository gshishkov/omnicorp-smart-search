import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  const port = app.get(AppConfigService).get('PORT');
  await app.listen(port, '0.0.0.0');
  Logger.log(`SmartSearch API listening on port ${port} (docs at /api/docs)`, 'Bootstrap');
}

bootstrap().catch((err: Error) => {
  // Config validation errors land here; they list keys only, never secret values.
  console.error(err.message);
  process.exit(1);
});
