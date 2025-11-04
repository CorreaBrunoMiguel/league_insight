// src/jobs/ingestSeason.ts
import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import { prisma } from '../db';

type CliArgs = {
  leagueCode: string;
  seasonYear: number;
  source: string;
  filePath: string;
  force: boolean;
};

function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2); // ignora node/tsx
  const map: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith('--')) continue;

    // suporta --name=value
    if (arg.includes('=')) {
      const [flag, value] = arg.split('=', 2);
      const key = flag.replace(/^--/, '');
      map[key] = value;
    } else {
      // suporta --name value
      const key = arg.replace(/^--/, '');
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        map[key] = next;
        i++; // pula o próximo
      } else {
        map[key] = 'true'; // só flag booleana
      }
    }
  }

  const leagueCode = map['leagueCode'];
  const seasonYearStr = map['seasonYear'];
  const source = map['source'];
  const filePath = map['file'];
  const forceFlag = map['force'];
  const force =
    forceFlag === 'true' || forceFlag === '1' || forceFlag === 'yes';

  if (!leagueCode || !seasonYearStr || !source || !filePath) {
    console.error(
      'Uso: npm run ingest:season -- --leagueCode=BRA_SERIE_A --seasonYear=2023 --source=csv_brasileirao_2023 --file=./datasets/brasileirao_2023.csv'
    );
    process.exit(1);
  }

  const seasonYear = Number(seasonYearStr);
  if (!Number.isInteger(seasonYear)) {
    console.error('seasonYear deve ser um número inteiro, ex.: 2023');
    process.exit(1);
  }

  return { leagueCode, seasonYear, source, filePath, force };
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
      name: leagueCode, // pode refinar depois
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

async function ingestSeasonFromCsv(
  args: CliArgs,
  leagueId: number,
  seasonId: number,
  datasetId: number
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const parser = parse({
      columns: true,
      trim: true,
    });

    const stream = createReadStream(args.filePath).pipe(parser);
    let processedCount = 0;

    stream.on('error', (err) => {
      reject(err);
    });

    (async () => {
      try {
        for await (const record of stream as AsyncIterable<RawMatchRow>) {
          const round = Number(record.round);
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

        resolve(processedCount);
      } catch (err) {
        reject(err);
      }
    })();
  });
}

async function main() {
  const args = parseCliArgs();
  console.log(
    `Iniciando ingestão histórica: league=${args.leagueCode}, seasonYear=${args.seasonYear}, source=${args.source}, force=${args.force}`
  );

  const league = await getOrCreateLeague(args.leagueCode);
  const season = await getOrCreateSeason(league.id, args.seasonYear);

  const existingDataset = await prisma.dataset.findFirst({
    where: {
      leagueId: league.id,
      seasonId: season.id,
      source: args.source,
      type: 'HISTORICAL',
    },
  });

  if (existingDataset && !args.force) {
    console.log(
      `Dataset histórico já existe para league=${args.leagueCode}, season=${args.seasonYear}, source=${args.source}. Use --force=true para reprocessar.`
    );
    await prisma.$disconnect();
    return;
  }

  const dataset = existingDataset
    ? await prisma.dataset.update({
        where: { id: existingDataset.id },
        data: {
          status: 'PENDING',
          ingestedAt: null,
        },
      })
    : await prisma.dataset.create({
        data: {
          source: args.source,
          type: 'HISTORICAL',
          status: 'PENDING',
          leagueId: league.id,
          seasonId: season.id,
        },
      });

  const start = Date.now();

  try {
    const processedCount = await ingestSeasonFromCsv(
      args,
      league.id,
      season.id,
      dataset.id
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
      `Ingestão concluída com sucesso em ${elapsed.toFixed(2)}s para season ${
        args.seasonYear
      }. Jogos processados: ${processedCount}.`
    );
  } catch (err) {
    console.error('Erro durante ingestão da temporada:', err);
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
  console.error('Erro inesperado no job de ingestão:', err);
  process.exit(1);
});
