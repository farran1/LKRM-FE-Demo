-- CreateIndex
CREATE INDEX "player_goals_playerId_idx" ON "player_goals"("playerId");

-- CreateIndex
CREATE INDEX "player_goals_createdBy_idx" ON "player_goals"("createdBy");

-- CreateIndex
CREATE INDEX "player_notes_playerId_idx" ON "player_notes"("playerId");

-- CreateIndex
CREATE INDEX "player_notes_createdBy_idx" ON "player_notes"("createdBy");

-- CreateIndex
CREATE INDEX "players_createdBy_idx" ON "players"("createdBy");
