-- Existing refresh-token values were stored in clear text. Invalidate them all
-- and revoke every current JWT session before replacing the column.
DELETE FROM "refresh_tokens";
UPDATE "users" SET "session_version" = "session_version" + 1;

ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "token_hash";
ALTER TABLE "refresh_tokens"
  ADD COLUMN "authenticated_at" TIMESTAMP(3) NOT NULL;
