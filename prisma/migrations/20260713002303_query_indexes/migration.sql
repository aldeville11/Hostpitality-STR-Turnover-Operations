-- CreateIndex
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "BackgroundJob_status_runAt_idx" ON "BackgroundJob"("status", "runAt");

-- CreateIndex
CREATE INDEX "BackgroundJob_companyId_status_idx" ON "BackgroundJob"("companyId", "status");

-- CreateIndex
CREATE INDEX "Issue_companyId_status_idx" ON "Issue"("companyId", "status");

-- CreateIndex
CREATE INDEX "Turnover_companyId_status_idx" ON "Turnover"("companyId", "status");

-- CreateIndex
CREATE INDEX "Turnover_companyId_deadlineAt_idx" ON "Turnover"("companyId", "deadlineAt");

-- CreateIndex
CREATE INDEX "Turnover_companyId_windowStart_idx" ON "Turnover"("companyId", "windowStart");
