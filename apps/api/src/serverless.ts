import express = require('express');
import { ExpressAdapter } from '@nestjs/platform-express';
import { createNestApp } from './app';

let cachedServer: express.Express | undefined;

async function getServerlessApp() {
  if (cachedServer) return cachedServer;

  const server = express();
  const app = await createNestApp(new ExpressAdapter(server));
  await app.init();

  cachedServer = server;
  return cachedServer;
}

export default async function handler(req: express.Request, res: express.Response) {
  if (req.url === '/' || req.url === '/api') {
    req.url = '/api/health';
  }

  const server = await getServerlessApp();
  return server(req, res);
}
