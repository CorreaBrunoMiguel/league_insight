// src/jobs/checkSeasonConsistency.ts
import { prisma } from '../db';

type CliArgs = {
  leagueCode: string;
  seasonYear: number;
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

  if (!leagueCode || !seasonYearStr) {
    console.error(
      'Uso: npm run consistency:season -- --leagueCode=BRA_SERIE_A --seasonYear=2021'
    );
    process.exit(1);
  }

  const seasonYear = Number(seasonYearStr);
  if (!Number.isInteger(seasonYear)) {
    console.error('seasonYear deve ser um número inteiro, ex.: 2021');
    process.exit(1);
  }

  return { leagueCode, seasonYear };
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
    return a.teamId - b.teamId;
  });
}

async function checkSeasonConsistency(leagueCode: string, year: number) {
  console.log(
    `Iniciando checks de consistência: league=${leagueCode}, seasonYear=${year}`
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
      `Season para league=${leagueCode}, year=${year} não encontrada.`
    );
    process.exit(1);
  }

  const matches = await prisma.match.findMany({
    where: { seasonId: season.id },
    orderBy: [{ round: 'asc' }, { matchDate: 'asc' }, { id: 'asc' }],
  });

  if (matches.length === 0) {
    console.warn(
      'Nenhuma partida encontrada para essa season. Nada a verificar.'
    );
    return;
  }

  const distinctRounds = Array.from(new Set(matches.map((m) => m.round))).sort(
    (a, b) => a - b
  );

  console.log(
    `Partidas encontradas: ${
      matches.length
    }. Rodadas distintas: [${distinctRounds.join(', ')}].`
  );

  let globalMismatches = 0;
  let globalMissingSnapshots = 0;
  let globalTeamsWithoutMatches = 0;

  const statsMap = new Map<number, TeamStats>();
  let currentRound = matches[0].round;

  const flushRoundChecks = async (round: number) => {
    const statsArray = sortTable(Array.from(statsMap.values()));

    const snapshots = await prisma.standingSnapshot.findMany({
      where: {
        seasonId: season.id,
        round,
      },
    });

    const snapshotByTeam = new Map(snapshots.map((s) => [s.teamId, s]));

    console.log(
      `Rodada ${round}: ${statsArray.length} times com stats acumulados, ${snapshots.length} snapshots encontrados.`
    );

    for (const s of statsArray) {
      const snap = snapshotByTeam.get(s.teamId);
      if (!snap) {
        globalMissingSnapshots++;
        console.warn(
          `Rodada ${round}: snapshot ausente para teamId=${s.teamId}.`
        );
        continue;
      }

      let mismatches = 0;

      if (snap.points !== s.points) mismatches++;
      if (snap.played !== s.played) mismatches++;
      if (snap.wins !== s.wins) mismatches++;
      if (snap.draws !== s.draws) mismatches++;
      if (snap.losses !== s.losses) mismatches++;
      if (snap.goalsFor !== s.goalsFor) mismatches++;
      if (snap.goalsAgainst !== s.goalsAgainst) mismatches++;
      if (snap.goalDiff !== s.goalDiff) mismatches++;

      if (mismatches > 0) {
        globalMismatches++;
        console.warn(
          `Rodada ${round}: inconsistência para teamId=${
            s.teamId
          }. Stats calculados=${JSON.stringify(s)}, snapshot=${JSON.stringify({
            points: snap.points,
            played: snap.played,
            wins: snap.wins,
            draws: snap.draws,
            losses: snap.losses,
            goalsFor: snap.goalsFor,
            goalsAgainst: snap.goalsAgainst,
            goalDiff: snap.goalDiff,
          })}`
        );
      }
    }

    // times que estão em snapshot mas não aparecem nos stats (sem partidas jogadas ainda)
    for (const snap of snapshots) {
      if (!statsMap.has(snap.teamId) && snap.played > 0) {
        globalTeamsWithoutMatches++;
        console.warn(
          `Rodada ${round}: snapshot com played > 0 para teamId=${snap.teamId}, mas stats não possuem esse time.`
        );
      }
    }
  };

  for (const match of matches) {
    if (match.round !== currentRound) {
      await flushRoundChecks(currentRound);
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

  await flushRoundChecks(currentRound);

  console.log('Resumo dos checks:');
  console.log(`- Inconsistências de stats vs snapshots: ${globalMismatches}`);
  console.log(
    `- Snapshots ausentes para times com stats: ${globalMissingSnapshots}`
  );
  console.log(
    `- Times em snapshots com played > 0 mas sem stats de partida: ${globalTeamsWithoutMatches}`
  );
}

async function main() {
  const { leagueCode, seasonYear } = parseCliArgs();

  try {
    await checkSeasonConsistency(leagueCode, seasonYear);
  } catch (err) {
    console.error('Erro ao executar checks de consistência:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Erro inesperado no job de consistência:', err);
  process.exit(1);
});
