// src/services/trainDatasetService.ts
import { prisma } from '../db';

export type TrainDatasetSeasonSelector =
  | {
      seasonId: number;
      leagueCode?: never;
      seasonYear?: never;
    }
  | {
      seasonId?: never;
      leagueCode: string;
      seasonYear: number;
    };

export type TrainDatasetParams = TrainDatasetSeasonSelector & {
  roundStart?: number;
  roundEnd?: number;
  featureSchemaCode?: string;
};

export type TeamStandingSnapshotView = {
  teamId: number;
  round: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  position: number;
};

export type MatchFeaturesView = {
  homePoints?: number | null;
  awayPoints?: number | null;
  homeGoalDiff?: number | null;
  awayGoalDiff?: number | null;
  homeRecentForm?: number | null;
  awayRecentForm?: number | null;
};

export type TrainMatchExample = {
  matchId: number;
  seasonId: number;
  round: number;
  matchDate: Date;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  result: string;
  preMatchStandingHome: TeamStandingSnapshotView | null;
  preMatchStandingAway: TeamStandingSnapshotView | null;
  features: MatchFeaturesView | null;
};

async function resolveSeason(selector: TrainDatasetSeasonSelector) {
  if ('seasonId' in selector && selector.seasonId != null) {
    const season = await prisma.season.findUnique({
      where: { id: selector.seasonId },
    });
    if (!season) {
      throw new Error(`Season com id=${selector.seasonId} não encontrada.`);
    }
    return season;
  }

  const { leagueCode, seasonYear } = selector as {
    leagueCode: string;
    seasonYear: number;
  };

  const league = await prisma.league.findUnique({
    where: { code: leagueCode },
  });

  if (!league) {
    throw new Error(`League com code=${leagueCode} não encontrada.`);
  }

  const season = await prisma.season.findFirst({
    where: {
      leagueId: league.id,
      year: seasonYear,
    },
  });

  if (!season) {
    throw new Error(
      `Season para league=${leagueCode}, year=${seasonYear} não encontrada.`
    );
  }

  return season;
}

export async function getTrainDatasetForSeason(
  params: TrainDatasetParams
): Promise<TrainMatchExample[]> {
  const { roundStart, roundEnd, featureSchemaCode } = params;

  const season = await resolveSeason(params as TrainDatasetSeasonSelector);
  const seasonId = season.id;

  // 1) Buscar matches na janela
  const matchWhere: any = { seasonId };

  if (roundStart != null || roundEnd != null) {
    matchWhere.round = {};
    if (roundStart != null) {
      matchWhere.round.gte = roundStart;
    }
    if (roundEnd != null) {
      matchWhere.round.lte = roundEnd;
    }
  }

  const matches = await prisma.match.findMany({
    where: matchWhere,
    orderBy: [{ round: 'asc' }, { matchDate: 'asc' }, { id: 'asc' }],
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (matches.length === 0) {
    return [];
  }

  // 2) StandingSnapshots pré-jogo (rodada anterior)
  const prevRounds = Array.from(
    new Set(matches.map((m) => m.round - 1).filter((r) => r > 0))
  );

  const snapshots =
    prevRounds.length > 0
      ? await prisma.standingSnapshot.findMany({
          where: {
            seasonId,
            round: { in: prevRounds },
          },
        })
      : [];

  const snapshotMap = new Map<string, TeamStandingSnapshotView>();

  for (const s of snapshots) {
    const key = `${s.round}:${s.teamId}`;
    snapshotMap.set(key, {
      teamId: s.teamId,
      round: s.round,
      points: s.points,
      played: s.played,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDiff: s.goalDiff,
      position: s.position,
    });
  }

  // 3) Features (opcional)
  let featuresMap = new Map<number, MatchFeaturesView>();

  if (featureSchemaCode) {
    const featureSchema = await prisma.featureSchema.findUnique({
      where: { code: featureSchemaCode },
    });

    if (!featureSchema) {
      throw new Error(
        `FeatureSchema com code=${featureSchemaCode} não encontrado.`
      );
    }

    const matchIds = matches.map((m) => m.id);

    const features = await prisma.matchFeatures.findMany({
      where: {
        featureSchemaId: featureSchema.id,
        matchId: {
          in: matchIds,
        },
      },
    });

    featuresMap = new Map(
      features.map((f) => [
        f.matchId,
        {
          homePoints: f.homePoints,
          awayPoints: f.awayPoints,
          homeGoalDiff: f.homeGoalDiff,
          awayGoalDiff: f.awayGoalDiff,
          homeRecentForm: f.homeRecentForm,
          awayRecentForm: f.awayRecentForm,
        },
      ])
    );
  }

  // 4) Montar dataset final
  const dataset: TrainMatchExample[] = matches.map((m) => {
    const prevRound = m.round - 1;

    const preHome =
      prevRound > 0
        ? snapshotMap.get(`${prevRound}:${m.homeTeamId}`) ?? null
        : null;

    const preAway =
      prevRound > 0
        ? snapshotMap.get(`${prevRound}:${m.awayTeamId}`) ?? null
        : null;

    const feat = featuresMap.get(m.id) ?? null;

    return {
      matchId: m.id, // <- AQUI é onde garante que cada jogo usa o id real do Match
      seasonId: m.seasonId,
      round: m.round,
      matchDate: m.matchDate,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeTeamName: m.homeTeam.name,
      awayTeamName: m.awayTeam.name,
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
      result: m.result,
      preMatchStandingHome: preHome,
      preMatchStandingAway: preAway,
      features: feat,
    };
  });

  return dataset;
}
