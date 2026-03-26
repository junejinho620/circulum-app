import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: true, // trust load balancer headers (X-Forwarded-*)
      bodyLimit: 5 * 1024 * 1024, // 5MB max body
    }),
  );

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') || 3000;
  const nodeEnv = config.get<string>('app.nodeEnv');
  const frontendUrl = config.get<string>('app.frontendUrl') || '*';

  // ─── Security: Helmet (HTTP headers) ──────────────────────
  const fastify = app.getHttpAdapter().getInstance();
  await fastify.register(require('@fastify/helmet'), {
    contentSecurityPolicy: nodeEnv === 'production',
    crossOriginEmbedderPolicy: false,
  });

  // ─── Security: Rate limiting (global) ─────────────────────
  await fastify.register(require('@fastify/rate-limit'), {
    max: 200,       // 200 requests
    timeWindow: 60_000, // per 60 seconds
    allowList: ['127.0.0.1'],
  });

  // ─── CORS ─────────────────────────────────────────────────
  app.enableCors({
    origin: nodeEnv === 'production' ? frontendUrl : true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // preflight cache 24h
  });

  // ─── Global prefix ────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Global validation pipe ───────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global filters & interceptors ────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // ─── Graceful shutdown ────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  logger.log(`Circulum API running on port ${port} [${nodeEnv}]`);
  logger.log(`CORS origin: ${nodeEnv === 'production' ? frontendUrl : '*'}`);
}

bootstrap();
