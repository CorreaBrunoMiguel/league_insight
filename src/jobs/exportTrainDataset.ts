// src/jobs/exportTrainDataset.ts
import { writeFileSync } from 'node:fs';
import { prisma } from '../db';
import {
  getTrainDatasetForSeason,
  TrainDatasetParams,
  TrainMatchExample,
} from '../services/trainDatasetService';

type CliArgs = {
  seasonId?: number;
  leagueCode?: string;
  seasonYear?: number;
  roundStart?: number;
  roundEnd?: number;
  featureSchemaCode?: string;
  format: 'json' | 'csv';
  out?: string;
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

  const seasonIdStr = map['seasonId'];
  const leagueCode = map['leagueCode'];
  const seasonYearStr = map['seasonYear'];
  const roundStartStr = map['roundStart'];
  const roundEndStr = map['roundEnd'];
  const featureSchemaCode = map['featureSchemaCode'];
  const formatRaw = map['format'] ?? 'json';
  const out = map['out'];

  const format = formatRaw === 'csv' ? 'csv' : 'json';

  const seasonId = seasonIdStr != null ? Number(seasonIdStr) : undefined;
  const seasonYear = seasonYearStr != null ? Number(seasonYearStr) : undefined;
  const roundStart = roundStartStr != null ? Number(roundStartStr) : undefined;
  const roundEnd = roundEndStr != null ? Number(roundEndStr) : undefined;

  if (seasonId == null && (!leagueCode || seasonYear == null)) {
    console.error(
      'Uso: npm run export:train-dataset -- --seasonId=1 [--roundStart=1 --roundEnd=10 --featureSchemaCode=v1_basica --format=csv --out=./out.csv]'
    );
    console.error(
      '   ou: npm run export:train-dataset -- --leagueCode=BRA_SERIE_A --seasonYear=2021 [...opções]'
    );
    process.exit(1);
  }

  return {
    seasonId,
    leagueCode,
    seasonYear,
    roundStart,
    roundEnd,
    featureSchemaCode,
    format,
    out,
  };
}

function datasetToCsv(rows: TrainMatchExample[]): string {
  const header = [
    'matchId',
    'seasonId',
    'round',
    'matchDate',
    'homeTeamId',
    'awayTeamId',
    'homeTeamName',
    'awayTeamName',
    'homeGoals',
    'awayGoals',
    'result',
    'preHome_points',
    'preHome_played',
    'preHome_position',
    'preAway_points',
    'preAway_played',
    'preAway_position',
    'feat_homePoints',
    'feat_awayPoints',
    'feat_homeGoalDiff',
    'feat_awayGoalDiff',
    'feat_homeRecentForm',
    'feat_awayRecentForm',
  ];

  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = rows.map((r) => {
    const preH = r.preMatchStandingHome;
    const preA = r.preMatchStandingAway;
    const f = r.features;

    const cols: (string | number | null | undefined)[] = [
      r.matchId,
      r.seasonId,
      r.round,
      r.matchDate.toISOString(),
      r.homeTeamId,
      r.awayTeamId,
      r.homeTeamName,
      r.awayTeamName,
      r.homeGoals,
      r.awayGoals,
      r.result,
      preH?.points,
      preH?.played,
      preH?.position,
      preA?.points,
      preA?.played,
      preA?.position,
      f?.homePoints,
      f?.awayPoints,
      f?.homeGoalDiff,
      f?.awayGoalDiff,
      f?.homeRecentForm,
      f?.awayRecentForm,
    ];

    return cols.map(escape).join(',');
  });

  return [header.join(','), ...lines].join('\n');
}

async function main() {
  const args = parseCliArgs();

  const params: TrainDatasetParams =
    args.seasonId != null
      ? {
          seasonId: args.seasonId,
          roundStart: args.roundStart,
          roundEnd: args.roundEnd,
          featureSchemaCode: args.featureSchemaCode,
        }
      : {
          leagueCode: args.leagueCode!,
          seasonYear: args.seasonYear!,
          roundStart: args.roundStart,
          roundEnd: args.roundEnd,
          featureSchemaCode: args.featureSchemaCode,
        };

  console.log('Gerando dataset de treino com parâmetros:', {
    seasonId: params['seasonId'],
    leagueCode: (params as any).leagueCode,
    seasonYear: (params as any).seasonYear,
    roundStart: params.roundStart,
    roundEnd: params.roundEnd,
    featureSchemaCode: params.featureSchemaCode,
    format: args.format,
    out: args.out,
  });

  try {
    const dataset = await getTrainDatasetForSeason(params);

    console.log(`Total de jogos no dataset: ${dataset.length}`);

    let content: string;

    if (args.format === 'csv') {
      content = datasetToCsv(dataset);
    } else {
      content = JSON.stringify(dataset, null, 2);
    }

    if (args.out) {
      writeFileSync(args.out, content, { encoding: 'utf-8' });
      console.log(`Dataset salvo em: ${args.out}`);
    } else {
      // stdout
      console.log(content);
    }
  } catch (err) {
    console.error('Erro ao gerar/exportar dataset de treino:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Erro inesperado no exportador de dataset de treino:', err);
  process.exit(1);
});
