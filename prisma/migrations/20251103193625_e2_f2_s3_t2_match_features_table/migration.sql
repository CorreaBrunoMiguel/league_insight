-- CreateTable
CREATE TABLE "MatchFeatures" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "featureSchemaId" INTEGER NOT NULL,
    "homePoints" DOUBLE PRECISION,
    "awayPoints" DOUBLE PRECISION,
    "homeGoalDiff" DOUBLE PRECISION,
    "awayGoalDiff" DOUBLE PRECISION,
    "homeRecentForm" DOUBLE PRECISION,
    "awayRecentForm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchFeatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchFeatures_featureSchemaId_idx" ON "MatchFeatures"("featureSchemaId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchFeatures_matchId_featureSchemaId_key" ON "MatchFeatures"("matchId", "featureSchemaId");

-- AddForeignKey
ALTER TABLE "MatchFeatures" ADD CONSTRAINT "MatchFeatures_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchFeatures" ADD CONSTRAINT "MatchFeatures_featureSchemaId_fkey" FOREIGN KEY ("featureSchemaId") REFERENCES "FeatureSchema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
