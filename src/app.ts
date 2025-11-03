import express from 'express';

import { prisma } from './db';

export function createApp() {
  const app = express();

  app.use(express.json());

  const SERVICE_NAME = 'LeagueInsight lab API';
  const APP_VERSION = process.env.APP_VERSION ?? '0.1.0';

  app.get('/', (_req, res) => {
    res.send(`${SERVICE_NAME} --- root OK`);
  });

  // Endpoint de Status
  app.get('/api/status', (_req, res) => {
    res.json({
      status: 'OK',
      service: SERVICE_NAME,
      version: APP_VERSION,
      uptime: process.uptime(),
    });
  });

  // Endpoint de healthz
  app.get('/api/healthz', (_req, res) => {
    res.json({
      status: 'OK',
    });
  });

  app.get('/api/healthz/db', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.json({
        status: 'OK',
        db: 'up',
      });
    } catch (error) {
      console.error('DB health check failed:', error);

      res.status(500).json({
        status: 'error',
        db: 'down',
      });
    }
  });

  return app;
}
