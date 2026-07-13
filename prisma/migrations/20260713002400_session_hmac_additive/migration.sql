-- AlterTable
ALTER TABLE "Session" ADD COLUMN "revokedAt" TIMESTAMP(3),
ADD COLUMN "rotatedAt" TIMESTAMP(3),
ADD COLUMN "tokenHash" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "token" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- Invalidate legacy raw-token sessions at cutover
UPDATE "Session" SET "revokedAt" = CURRENT_TIMESTAMP WHERE "tokenHash" IS NULL;
