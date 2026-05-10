import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { type AbstractHttpAdapter, NestFactory } from '@nestjs/core';
import cookieParser = require('cookie-parser');
import helmet from 'helmet';
import { AppModule } from './modules/app.module';

export function assertProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required production env: ${missing.join(', ')}`);
  }
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (adminPassword === 'admin123456' || adminPassword === 'BroMotors123!' || adminPassword === 'Br0Motors!2026_Admin#KZ') {
    throw new Error('Production ADMIN_PASSWORD must not use the local dev default');
  }
}

export function configureApp(app: INestApplication) {
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({ origin: corsOrigin.split(','), credentials: true });
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

export async function createNestApp(httpAdapter?: AbstractHttpAdapter) {
  const app = httpAdapter
    ? await NestFactory.create(AppModule, httpAdapter, { cors: false })
    : await NestFactory.create(AppModule, { cors: false });
  configureApp(app);
  return app;
}
