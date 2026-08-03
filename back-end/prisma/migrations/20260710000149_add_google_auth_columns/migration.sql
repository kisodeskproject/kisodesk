-- Align production users table with the current Prisma schema used by Google OAuth.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthProvider') THEN
    CREATE TYPE "AuthProvider" AS ENUM ('PASSWORD', 'GOOGLE');
  END IF;
END $$;

ALTER TABLE "users"
  ADD COLUMN "auth_provider" "AuthProvider" NOT NULL DEFAULT 'PASSWORD',
  ADD COLUMN "google_id" TEXT,
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "users"
  ALTER COLUMN "password_hash" DROP NOT NULL;

CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
