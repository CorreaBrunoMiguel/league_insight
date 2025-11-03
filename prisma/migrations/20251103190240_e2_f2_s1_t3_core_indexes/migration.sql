/*
  Warnings:

  - A unique constraint covering the columns `[seasonId,round,homeTeamId,awayTeamId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Match_seasonId_round_idx" ON "Match"("seasonId", "round");

-- CreateIndex
CREATE INDEX "Match_homeTeamId_idx" ON "Match"("homeTeamId");

-- CreateIndex
CREATE INDEX "Match_awayTeamId_idx" ON "Match"("awayTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_seasonId_round_homeTeamId_awayTeamId_key" ON "Match"("seasonId", "round", "homeTeamId", "awayTeamId");
