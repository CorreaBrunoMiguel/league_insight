// src/jobs/ingestSeasons.ts
import { spawn } from 'node:child_process';

type MultiArgs = {
  leagueCode: string;
  years: number[];
  sourcePrefix: string;
  filePattern: string;
};

function parseMultiArgs(): MultiArgs {
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
      }
    }
  }

  const leagueCode = map['leagueCode'];
  const yearsRaw = map['years'];
  const sourcePrefix = map['sourcePrefix'];
  const filePattern = map['filePattern'];

  if (!leagueCode || !yearsRaw || !sourcePrefix || !filePattern) {
    console.error(
      'Uso: npm run ingest:seasons -- --leagueCode=BRA_SERIE_A --years=2018,2019,2020,2021 --sourcePrefix=csv_brasileirao --filePattern=./datasets/brasileirao_{year}.csv'
    );
    process.exit(1);
  }

  const years = yearsRaw
    .split(',')
    .map((y) => Number(y.trim()))
    .filter((n) => Number.isInteger(n));

  if (years.length === 0) {
    console.error('Parâmetro --years inválido (ex.: 2018,2019,2020)');
    process.exit(1);
  }

  return { leagueCode, years, sourcePrefix, filePattern };
}

function runSeasonIngestionOnce(params: {
  leagueCode: string;
  year: number;
  sourcePrefix: string;
  filePattern: string;
}): Promise<void> {
  const { leagueCode, year, sourcePrefix, filePattern } = params;

  const source = `${sourcePrefix}_${year}`;
  const file = filePattern.replace('{year}', String(year));

  console.log(
    `>> Iniciando ingestão para temporada ${year} (source=${source}, file=${file})`
  );

  return new Promise((resolve, reject) => {
    const child = spawn(
      'npm',
      [
        'run',
        'ingest:season',
        '--',
        `--leagueCode=${leagueCode}`,
        `--seasonYear=${year}`,
        `--source=${source}`,
        `--file=${file}`,
      ],
      {
        stdio: 'inherit',
      }
    );

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✔ Temporada ${year} ingerida com sucesso.`);
        resolve();
      } else {
        console.error(`✖ Ingestão da temporada ${year} falhou (code=${code}).`);
        reject(new Error(`Ingestão falhou para temporada ${year}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  const { leagueCode, years, sourcePrefix, filePattern } = parseMultiArgs();

  console.log(
    `Iniciando ingestão multi-season para league=${leagueCode}, years=[${years.join(
      ', '
    )}]`
  );

  for (const year of years) {
    await runSeasonIngestionOnce({
      leagueCode,
      year,
      sourcePrefix,
      filePattern,
    });
  }

  console.log('✅ Ingestão multi-season concluída.');
}

main().catch((err) => {
  console.error('Erro inesperado no job de ingestão multi-season:', err);
  process.exit(1);
});
