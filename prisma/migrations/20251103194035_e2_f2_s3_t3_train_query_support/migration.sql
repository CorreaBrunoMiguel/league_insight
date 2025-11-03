-- CreateIndex
CREATE INDEX "Match_seasonId_matchDate_idx" ON "Match"("seasonId", "matchDate");

-- CreateIndex
CREATE INDEX "MatchFeatures_matchId_idx" ON "MatchFeatures"("matchId");
