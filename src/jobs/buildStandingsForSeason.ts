// src/jobs/buildStandingsForSeason.ts
import { prisma } from '../db';

type CliArgs = {
  leagueCode: string;
  seasonYear: number;
  force: boolean;
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
  const forceFlag = map['force'];
  const force =
    forceFlag === 'true' || forceFlag === '1' || forceFlag === 'yes';

  if (!leagueCode || !seasonYearStr) {
    console.error(
      'Uso: npm run standings:season -- --leagueCode=BRA_SERIE_A --seasonYear=2021 [--force=true]'
    );
    process.exit(1);
  }

  const seasonYear = Number(seasonYearStr);
  if (!Number.isInteger(seasonYear)) {
    console.error('seasonYear deve ser um número inteiro, ex.: 2021');
    process.exit(1);
  }

  return { leagueCode, seasonYear, force };
}

type TeamStats = {
  teamId: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
};

function createEmptyStats(teamId: number): TeamStats {
  return {
    teamId,
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
  };
}

function applyMatchToStats(
  stats: Map<number, TeamStats>,
  homeTeamId: number,
  awayTeamId: number,
  homeGoals: number,
  awayGoals: number
) {
  const homeStats = stats.get(homeTeamId) ?? createEmptyStats(homeTeamId);
  const awayStats = stats.get(awayTeamId) ?? createEmptyStats(awayTeamId);

  homeStats.played += 1;
  awayStats.played += 1;

  homeStats.goalsFor += homeGoals;
  homeStats.goalsAgainst += awayGoals;
  homeStats.goalDiff = homeStats.goalsFor - homeStats.goalsAgainst;

  awayStats.goalsFor += awayGoals;
  awayStats.goalsAgainst += homeGoals;
  awayStats.goalDiff = awayStats.goalsFor - awayStats.goalsAgainst;

  if (homeGoals > awayGoals) {
    homeStats.wins += 1;
    homeStats.points += 3;
    awayStats.losses += 1;
  } else if (homeGoals < awayGoals) {
    awayStats.wins += 1;
    awayStats.points += 3;
    homeStats.losses += 1;
  } else {
    homeStats.draws += 1;
    awayStats.draws += 1;
    homeStats.points += 1;
    awayStats.points += 1;
  }

  stats.set(homeTeamId, homeStats);
  stats.set(awayTeamId, awayStats);
}

function sortTable(stats: TeamStats[]): TeamStats[] {
  return stats.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamId - b.teamId; // desempate estável
  });
}

async function buildStandingsForSeason(
  leagueCode: string,
  year: number,
  force: boolean
) {
  console.log(
    `Iniciando reconstrução de standings: league=${leagueCode}, seasonYear=${year}, force=${force}`
  );

  const league = await prisma.league.findUnique({
    where: { code: leagueCode },
  });

  if (!league) {
    console.error(`League com code=${leagueCode} não encontrada.`);
    process.exit(1);
  }

  const season = await prisma.season.findFirst({
    where: {
      leagueId: league.id,
      year,
    },
  });

  if (!season) {
    console.error(
      `Season para league=${leagueCode}, year=${year} não encontrada. Ingerir partidas antes de gerar standings.`
    );
    process.exit(1);
  }

  const existingSnapshotsCount = await prisma.standingSnapshot.count({
    where: { seasonId: season.id },
  });

  if (existingSnapshotsCount > 0 && !force) {
    console.log(
      `Já existem ${existingSnapshotsCount} snapshots para a season ${year}. Use --force=true para recriar.`
    );
    return;
  }

  if (existingSnapshotsCount > 0 && force) {
    console.log(
      `Removendo ${existingSnapshotsCount} snapshots existentes para season ${year}...`
    );
    await prisma.standingSnapshot.deleteMany({
      where: { seasonId: season.id },
    });
  }

  const matches = await prisma.match.findMany({
    where: { seasonId: season.id },
    orderBy: [{ round: 'asc' }, { matchDate: 'asc' }, { id: 'asc' }],
  });

  if (matches.length === 0) {
    console.warn('Nenhuma partida encontrada para essa season. Nada a fazer.');
    return;
  }

  console.log(`Encontradas ${matches.length} partidas para season ${year}.`);

  const statsMap = new Map<number, TeamStats>();
  let currentRound = matches[0].round;
  let totalSnapshots = 0;

  const flushRoundSnapshots = async (round: number) => {
    const statsArray = sortTable(Array.from(statsMap.values()));

    let position = 1;
    for (const s of statsArray) {
      await prisma.standingSnapshot.upsert({
        where: {
          seasonId_round_teamId: {
            seasonId: season.id,
            round,
            teamId: s.teamId,
          },
        },
        update: {
          points: s.points,
          played: s.played,
          wins: s.wins,
          draws: s.draws,
          losses: s.losses,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDiff: s.goalDiff,
          position,
        },
        create: {
          seasonId: season.id,
          teamId: s.teamId,
          round,
          points: s.points,
          played: s.played,
          wins: s.wins,
          draws: s.draws,
          losses: s.losses,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDiff: s.goalDiff,
          position,
        },
      });

      totalSnapshots++;
      position++;
    }

    console.log(`Round ${round}: ${statsArray.length} snapshots gerados.`);
  };

  for (const match of matches) {
    if (match.round !== currentRound) {
      await flushRoundSnapshots(currentRound);
      currentRound = match.round;
    }

    applyMatchToStats(
      statsMap,
      match.homeTeamId,
      match.awayTeamId,
      match.homeGoals,
      match.awayGoals
    );
  }

  // flush da última rodada
  await flushRoundSnapshots(currentRound);

  console.log(
    `Standings geradas para season ${year}. Total de snapshots: ${totalSnapshots}.`
  );
}

async function main() {
  const { leagueCode, seasonYear, force } = parseCliArgs();

  try {
    await buildStandingsForSeason(leagueCode, seasonYear, force);
  } catch (err) {
    console.error('Erro ao reconstruir standings:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Erro inesperado no job de standings:', err);
  process.exit(1);
});
