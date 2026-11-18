import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/http-exception.filter';
import { AppConfigService } from './config/app-config.service';

const REQUEST_ID = /^[A-Za-z0-9-]{8,64}$/;

/** Shared by main.ts and e2e tests so both run the exact same HTTP pipeline. */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(AppConfigService);

  app.setGlobalPrefix('api');
  app.useBodyParser('json', { limit: '16kb' });
  // JSON-only API: CSP is irrelevant to JSON and would block the Swagger UI.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: config
      .get('CORS_ORIGIN')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    methods: ['GET', 'POST'],
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && REQUEST_ID.test(incoming) ? incoming : randomUUID();
    req.headers['x-request-id'] = id;
    res.setHeader('x-request-id', id);
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, stopAtFirstError: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const openApi = new DocumentBuilder()
    .setTitle('OmniCorp SmartSearch API')
    .setDescription('RAG chatbot over the OmniCorp knowledge base')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, openApi));
}
