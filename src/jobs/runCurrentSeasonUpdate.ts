// src/jobs/runCurrentSeasonUpdate.ts
import { spawn } from 'node:child_process';
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
      'Uso: npm run current:season:update -- --leagueCode=BRA_SERIE_A --seasonYear=2021 --source=csv_brasileirao_2021_rX --file=./datasets/brasileirao_2021.csv'
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

function runCommand(cmd: string[], label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`>> Iniciando etapa: ${label}`);
    const child = spawn(cmd[0], cmd.slice(1), {
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✔ Etapa concluída: ${label}`);
        resolve();
      } else {
        console.error(`✖ Etapa falhou (${label}), code=${code}`);
        reject(new Error(`Command failed for ${label}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function markCurrentSeasonDatasetsStatus(
  leagueCode: string,
  seasonYear: number,
  baseSourcePrefix: string,
  status: 'OK' | 'FAILED'
) {
  const league = await prisma.league.findUnique({
    where: { code: leagueCode },
  });
  if (!league) return;

  const season = await prisma.season.findFirst({
    where: {
      leagueId: league.id,
      year: seasonYear,
    },
  });
  if (!season) return;

  // Atualiza todos os datasets CURRENT_SEASON cujo source começa com o prefixo
  await prisma.dataset.updateMany({
    where: {
      leagueId: league.id,
      seasonId: season.id,
      type: 'CURRENT_SEASON',
      source: {
        startsWith: baseSourcePrefix,
      },
    },
    data: {
      status,
    },
  });
}

async function main() {
  const { leagueCode, seasonYear, source, filePath } = parseCliArgs();

  console.log(
    `Iniciando rotina unificada da temporada atual: league=${leagueCode}, seasonYear=${seasonYear}, source=${source}, file=${filePath}`
  );

  // Vamos assumir que o "source" passado é algo como "csv_brasileirao_2021_r10"
  const baseSourcePrefix = source.split('_r')[0] ?? source;

  try {
    // 1) Ingestão incremental (não mexe nas rodadas antigas, só nas novas)
    const incrementalCmd = [
      'npm',
      'run',
      'current:season:incremental',
      '--',
      `--leagueCode=${leagueCode}`,
      `--seasonYear=${seasonYear}`,
      `--source=${source}`,
      `--file=${filePath}`,
    ];

    await runCommand(incrementalCmd, 'Ingestão incremental da temporada atual');

    // 2) Recalcular standings da season inteira (sempre force=true)
    const standingsCmd = [
      'npm',
      'run',
      'standings:season',
      '--',
      `--leagueCode=${leagueCode}`,
      `--seasonYear=${seasonYear}`,
      '--force=true',
    ];

    await runCommand(
      standingsCmd,
      'Reconstrução de standings da temporada atual'
    );

    // Se tudo deu certo, marca datasets CURRENT_SEASON relacionados como OK
    await markCurrentSeasonDatasetsStatus(
      leagueCode,
      seasonYear,
      baseSourcePrefix,
      'OK'
    );

    console.log(
      `✅ Rotina unificada da temporada atual concluída com sucesso para league=${leagueCode}, seasonYear=${seasonYear}.`
    );
  } catch (err) {
    console.error('Erro na rotina unificada da temporada atual:', err);
    try {
      await markCurrentSeasonDatasetsStatus(
        leagueCode,
        seasonYear,
        source.split('_r')[0] ?? source,
        'FAILED'
      );
    } catch (innerErr) {
      console.error(
        'Erro ao marcar datasets CURRENT_SEASON como FAILED:',
        innerErr
      );
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Erro inesperado na rotina unificada da temporada atual:', err);
  process.exit(1);
});
