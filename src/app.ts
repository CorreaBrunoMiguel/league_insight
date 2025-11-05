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

  // Lista todas as ligas
  app.get('/leagues', async (req, res) => {
    try {
      const leagues = await prisma.league.findMany({
        orderBy: { id: 'asc' },
      });

      res.json(
        leagues.map((l) => ({
          id: l.id,
          code: l.code,
          name: l.name,
          country: l.country,
          createdAt: l.createdAt,
        }))
      );
    } catch (err) {
      console.error('Erro ao listar ligas:', err);
      res.status(500).json({ error: 'Erro ao listar ligas' });
    }
  });

  // Lista seasons de uma liga
  app.get('/leagues/:leagueCode/seasons', async (req, res) => {
    const { leagueCode } = req.params;

    try {
      const league = await prisma.league.findUnique({
        where: { code: leagueCode },
      });

      if (!league) {
        return res.status(404).json({
          error: `League com code=${leagueCode} não encontrada`,
        });
      }

      const seasons = await prisma.season.findMany({
        where: { leagueId: league.id },
        orderBy: { year: 'asc' },
      });

      res.json(
        seasons.map((s) => ({
          id: s.id,
          leagueId: s.leagueId,
          year: s.year,
          name: s.name,
          startDate: s.startDate,
          endDate: s.endDate,
          createdAt: s.createdAt,
        }))
      );
    } catch (err) {
      console.error('Erro ao listar seasons da liga:', err);
      res.status(500).json({ error: 'Erro ao listar seasons' });
    }
  });

  // Detalhes de uma season
  app.get('/seasons/:seasonId', async (req, res) => {
    const seasonId = Number(req.params.seasonId);

    if (!Number.isInteger(seasonId)) {
      return res.status(400).json({ error: 'seasonId inválido' });
    }

    try {
      const season = await prisma.season.findUnique({
        where: { id: seasonId },
        include: {
          league: true,
        },
      });

      if (!season) {
        return res
          .status(404)
          .json({ error: `Season com id=${seasonId} não encontrada` });
      }

      res.json({
        id: season.id,
        leagueId: season.leagueId,
        leagueCode: season.league.code,
        leagueName: season.league.name,
        year: season.year,
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
        createdAt: season.createdAt,
        updatedAt: season.updatedAt,
      });
    } catch (err) {
      console.error('Erro ao buscar season:', err);
      res.status(500).json({ error: 'Erro ao buscar season' });
    }
  });

  return app;
}
