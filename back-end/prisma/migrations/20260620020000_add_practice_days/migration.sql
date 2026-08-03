-- CreateTable
CREATE TABLE "practice_days" (
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_seconds" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_days_pkey" PRIMARY KEY ("user_id","date")
);

-- CreateIndex
CREATE INDEX "practice_days_user_id_date_idx" ON "practice_days"("user_id", "date");

-- AddForeignKey
ALTER TABLE "practice_days" ADD CONSTRAINT "practice_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill historical aggregate from free practice sessions and lesson attempts.
INSERT INTO "practice_days" ("user_id", "date", "total_seconds", "created_at", "updated_at")
SELECT
    source."user_id",
    date_trunc('day', source."created_at")::timestamp(3) AS "date",
    SUM(source."time_elapsed")::integer AS "total_seconds",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT "user_id", "created_at", "time_elapsed" FROM "practice_sessions"
    UNION ALL
    SELECT "user_id", "created_at", "time_elapsed" FROM "lesson_attempts"
) AS source
GROUP BY source."user_id", date_trunc('day', source."created_at")
ON CONFLICT ("user_id", "date") DO UPDATE SET
    "total_seconds" = EXCLUDED."total_seconds",
    "updated_at" = CURRENT_TIMESTAMP;
