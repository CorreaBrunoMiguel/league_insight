// src/jobs/incrementalCurrentSeason.ts
import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import { prisma } from '../db';

type CliArgs = {
  leagueCode: string;
  seasonYear: number;
  source: string;
  filePath: string;
};

function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2);
  const map: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith('--')) continue;

    if (arg.includes('=')) {
      const [flag, value] = arg.split('=', 2);
      const key = flag.replace(/^--/, '');
      map[key] = value;
    } else {
      const key = arg.replace(/^--/, '');
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        map[key] = next;
        i++;
      } else {
        map[key] = 'true';
      }
    }
  }

  const leagueCode = map['leagueCode'];
  const seasonYearStr = map['seasonYear'];
  const source = map['source'];
  const filePath = map['file'];

  if (!leagueCode || !seasonYearStr || !source || !filePath) {
    console.error(
      'Uso: npm run current:season:incremental -- --leagueCode=BRA_SERIE_A --seasonYear=2025 --source=csv_brasileirao_2025_r10 --file=./datasets/brasileirao_2025.csv'
    );
    process.exit(1);
  }

  const seasonYear = Number(seasonYearStr);
  if (!Number.isInteger(seasonYear)) {
    console.error('seasonYear deve ser um número inteiro, ex.: 2025');
    process.exit(1);
  }

  return { leagueCode, seasonYear, source, filePath };
}

type RawMatchRow = {
  round: string;
  date: string;
  home_team: string;
  away_team: string;
  home_goals: string;
  away_goals: string;
};

function computeResult(homeGoals: number, awayGoals: number) {
  if (homeGoals > awayGoals) return 'HOME_WIN' as const;
  if (homeGoals < awayGoals) return 'AWAY_WIN' as const;
  return 'DRAW' as const;
}

async function getOrCreateLeague(leagueCode: string) {
  return prisma.league.upsert({
    where: { code: leagueCode },
    update: {},
    create: {
      code: leagueCode,
      name: leagueCode,
      country: null,
    },
  });
}

async function getOrCreateSeason(leagueId: number, year: number) {
  const existing = await prisma.season.findFirst({
    where: { leagueId, year },
  });

  if (existing) return existing;

  return prisma.season.create({
    data: {
      leagueId,
      year,
      name: `${year}`,
      startDate: null,
      endDate: null,
    },
  });
}

async function getOrCreateTeam(name: string, leagueId: number) {
  const existing = await prisma.team.findFirst({
    where: {
      name,
      leagueId,
    },
  });

  if (existing) return existing;

  return prisma.team.create({
    data: {
      name,
      leagueId,
    },
  });
}

async function incrementalIngestFromCsv(
  leagueId: number,
  seasonId: number,
  datasetId: number,
  filePath: string,
  lastRoundInDb: number
): Promise<{ processed: number; skipped: number }> {
  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: true,
      trim: true,
    });

    const stream = createReadStream(filePath).pipe(parser);
    let processedCount = 0;
    let skippedCount = 0;

    stream.on('error', (err) => {
      reject(err);
    });

    (async () => {
      try {
        for await (const record of stream as AsyncIterable<RawMatchRow>) {
          const round = Number(record.round);

          if (!Number.isFinite(round)) {
            console.warn('Linha ignorada por round inválido:', record);
            continue;
          }

          if (round <= lastRoundInDb) {
            skippedCount++;
            continue;
          }

          const matchDate = new Date(record.date);
          const homeName = record.home_team;
          const awayName = record.away_team;
          const homeGoals = Number(record.home_goals);
          const awayGoals = Number(record.away_goals);

          if (!homeName || !awayName) {
            console.warn('Linha ignorada por falta de times:', record);
            continue;
          }

          const homeTeam = await getOrCreateTeam(homeName, leagueId);
          const awayTeam = await getOrCreateTeam(awayName, leagueId);

          const result = computeResult(homeGoals, awayGoals);

          await prisma.match.upsert({
            where: {
              seasonId_round_homeTeamId_awayTeamId: {
                seasonId,
                round,
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
              },
            },
            update: {
              matchDate,
              homeGoals,
              awayGoals,
              result,
              datasetId,
            },
            create: {
              seasonId,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              round,
              matchDate,
              homeGoals,
              awayGoals,
              result,
              datasetId,
            },
          });

          processedCount++;
        }

        resolve({ processed: processedCount, skipped: skippedCount });
      } catch (err) {
        reject(err);
      }
    })();
  });
}

async function main() {
  const args = parseCliArgs();
  console.log(
    `Iniciando ingestão incremental da temporada atual: league=${args.leagueCode}, seasonYear=${args.seasonYear}, source=${args.source}`
  );

  const league = await getOrCreateLeague(args.leagueCode);
  const season = await getOrCreateSeason(league.id, args.seasonYear);

  const lastMatch = await prisma.match.findFirst({
    where: { seasonId: season.id },
    orderBy: { round: 'desc' },
  });

  const lastRoundInDb = lastMatch ? lastMatch.round : 0;
  console.log(`Última rodada registrada no banco: ${lastRoundInDb}`);

  const dataset = await prisma.dataset.create({
    data: {
      source: args.source,
      type: 'CURRENT_SEASON',
      status: 'PENDING',
      leagueId: league.id,
      seasonId: season.id,
    },
  });

  const start = Date.now();

  try {
    const { processed, skipped } = await incrementalIngestFromCsv(
      league.id,
      season.id,
      dataset.id,
      args.filePath,
      lastRoundInDb
    );

    await prisma.dataset.update({
      where: { id: dataset.id },
      data: {
        status: 'OK',
        ingestedAt: new Date(),
      },
    });

    const elapsed = (Date.now() - start) / 1000;
    console.log(
      `Ingestão incremental concluída em ${elapsed.toFixed(
        2
      )}s. Jogos novos processados: ${processed}. Linhas ignoradas (rodadas antigas ou inválidas): ${skipped}.`
    );
  } catch (err) {
    console.error('Erro durante ingestão incremental da temporada atual:', err);
    await prisma.dataset.update({
      where: { id: dataset.id },
      data: {
        status: 'FAILED',
      },
    });
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Erro inesperado no job incremental da temporada atual:', err);
  process.exit(1);
});
