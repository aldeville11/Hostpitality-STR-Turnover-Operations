-- AlterTable
ALTER TABLE "BackgroundJob" ADD COLUMN "leaseExpiresAt" TIMESTAMP(3),
ADD COLUMN "claimToken" TEXT;

-- CreateIndex
CREATE INDEX "BackgroundJob_status_leaseExpiresAt_idx" ON "BackgroundJob"("status", "leaseExpiresAt");
