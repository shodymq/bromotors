import { assertProductionEnv, createNestApp } from './app';

async function bootstrap() {
  assertProductionEnv();
  const app = await createNestApp();
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

void bootstrap();
