import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './modules/app.module';

function assertProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;
  const missing = ['DATABASE_URL', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'JWT_SECRET'].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required production env: ${missing.join(', ')}`);
  }
  if (process.env.ADMIN_PASSWORD === 'BroMotors123!') {
    throw new Error('Production ADMIN_PASSWORD must not use the local dev default');
  }
}

async function bootstrap() {
  assertProductionEnv();
  const app = await NestFactory.create(AppModule, { cors: false });
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
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

bootstrap();
