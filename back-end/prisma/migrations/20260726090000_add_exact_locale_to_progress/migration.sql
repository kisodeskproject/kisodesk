ALTER TABLE "practice_sessions"
ADD COLUMN "locale_code" TEXT NOT NULL DEFAULT 'es-latam';

ALTER TABLE "user_lesson_progress"
ADD COLUMN "locale_code" TEXT NOT NULL DEFAULT 'es-latam';

ALTER TABLE "practice_days"
ADD COLUMN "locale_code" TEXT NOT NULL DEFAULT 'es-latam';

ALTER TABLE "key_stats"
ADD COLUMN "locale_code" TEXT NOT NULL DEFAULT 'es-latam';

ALTER TABLE "practice_days" DROP CONSTRAINT "practice_days_pkey";
ALTER TABLE "practice_days" ADD CONSTRAINT "practice_days_pkey" PRIMARY KEY ("user_id", "date", "locale_code");

DROP INDEX "user_lesson_progress_user_id_lesson_id_key";
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_lesson_id_locale_code_key" UNIQUE ("user_id", "lesson_id", "locale_code");

ALTER TABLE "key_stats" DROP CONSTRAINT "key_stats_pkey";
ALTER TABLE "key_stats" ADD CONSTRAINT "key_stats_pkey" PRIMARY KEY ("user_id", "language_code", "locale_code", "key_char");

CREATE INDEX "practice_sessions_user_id_locale_code_created_at_idx" ON "practice_sessions"("user_id", "locale_code", "created_at");
CREATE INDEX "user_lesson_progress_user_id_locale_code_idx" ON "user_lesson_progress"("user_id", "locale_code");
CREATE INDEX "practice_days_user_id_locale_code_date_idx" ON "practice_days"("user_id", "locale_code", "date");
CREATE INDEX "key_stats_user_id_locale_code_idx" ON "key_stats"("user_id", "locale_code");
