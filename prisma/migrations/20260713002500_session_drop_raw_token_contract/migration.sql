-- DropIndex
DROP INDEX IF EXISTS "Session_token_key";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "token";

-- Enforce tokenHash presence for new sessions
ALTER TABLE "Session" ALTER COLUMN "tokenHash" SET NOT NULL;
