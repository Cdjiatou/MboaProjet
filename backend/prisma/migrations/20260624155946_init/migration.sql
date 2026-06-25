-- CreateIndex
CREATE INDEX "Candidate_slug_idx" ON "Candidate"("slug");

-- CreateIndex
CREATE INDEX "Candidate_categoryId_idx" ON "Candidate"("categoryId");

-- CreateIndex
CREATE INDEX "Vote_candidateId_voterIdentifier_idx" ON "Vote"("candidateId", "voterIdentifier");
