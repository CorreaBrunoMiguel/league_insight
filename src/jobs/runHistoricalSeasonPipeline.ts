// src/jobs/runHistoricalSeasonPipeline.ts
import { spawn } from 'node:child_process';
import { prisma } from '../db';

type CliArgs = {
  leagueCode: string;
  seasonYear: number;
  source: string;
  filePath: string;
  forceMatches: boolean;
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
  const forceMatchesFlag = map['forceMatches'];
  const forceMatches =
    forceMatchesFlag === 'true' ||
    forceMatchesFlag === '1' ||
    forceMatchesFlag === 'yes';

  if (!leagueCode || !seasonYearStr || !source || !filePath) {
    console.error(
      'Uso: npm run historical:season:full -- --leagueCode=BRA_SERIE_A --seasonYear=2021 --source=csv_brasileirao_2021 --file=./datasets/brasileirao_2021.csv [--forceMatches=true]'
    );
    process.exit(1);
  }

  const seasonYear = Number(seasonYearStr);
  if (!Number.isInteger(seasonYear)) {
    console.error('seasonYear deve ser um número inteiro, ex.: 2021');
    process.exit(1);
  }

  return { leagueCode, seasonYear, source, filePath, forceMatches };
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

async function markDatasetStatus(
  leagueCode: string,
  seasonYear: number,
  source: string,
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

  const dataset = await prisma.dataset.findFirst({
    where: {
      leagueId: league.id,
      seasonId: season.id,
      source,
      type: 'HISTORICAL',
    },
  });

  if (!dataset) return;

  await prisma.dataset.update({
    where: { id: dataset.id },
    data: {
      status,
    },
  });
}

async function main() {
  const { leagueCode, seasonYear, source, filePath, forceMatches } =
    parseCliArgs();

  console.log(
    `Iniciando pipeline histórico completo: league=${leagueCode}, seasonYear=${seasonYear}, source=${source}, file=${filePath}, forceMatches=${forceMatches}`
  );

  try {
    // 1) Ingestão de partidas
    const ingestCmd = [
      'npm',
      'run',
      'ingest:season',
      '--',
      `--leagueCode=${leagueCode}`,
      `--seasonYear=${seasonYear}`,
      `--source=${source}`,
      `--file=${filePath}`,
    ];

    if (forceMatches) {
      ingestCmd.push('--force=true');
    }

    await runCommand(ingestCmd, 'Ingestão histórica de partidas');

    // 2) Reconstrução de standings (sempre com force=true para garantir alinhamento)
    const standingsCmd = [
      'npm',
      'run',
      'standings:season',
      '--',
      `--leagueCode=${leagueCode}`,
      `--seasonYear=${seasonYear}`,
      '--force=true',
    ];

    await runCommand(standingsCmd, 'Reconstrução de standings');

    // Se chegou até aqui, damos OK explícito pro Dataset
    await markDatasetStatus(leagueCode, seasonYear, source, 'OK');

    console.log(
      `✅ Pipeline histórico completo concluído para league=${leagueCode}, seasonYear=${seasonYear}, source=${source}.`
    );
  } catch (err) {
    console.error('Erro no pipeline histórico completo:', err);
    // Se alguma etapa falhar, marcamos o Dataset como FAILED (se existir)
    try {
      await markDatasetStatus(leagueCode, seasonYear, source, 'FAILED');
    } catch (innerErr) {
      console.error(
        'Erro ao marcar Dataset como FAILED após falha no pipeline:',
        innerErr
      );
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Erro inesperado no pipeline histórico completo:', err);
  process.exit(1);
});
