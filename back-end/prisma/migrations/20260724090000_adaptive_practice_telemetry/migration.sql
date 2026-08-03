ALTER TABLE "practice_sessions"
  ADD COLUMN "telemetry_version" INTEGER,
  ADD COLUMN "telemetry" JSONB,
  ADD COLUMN "derived_metrics" JSONB;

ALTER TABLE "practice_texts"
  ADD COLUMN "word_index" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "bigram_index" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "accent_index" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "practice_texts_language_words_idx" ON "practice_texts" USING GIN ("word_index");
CREATE INDEX "practice_texts_language_bigrams_idx" ON "practice_texts" USING GIN ("bigram_index");

CREATE TABLE "bigram_stats" (
  "user_id" TEXT NOT NULL,
  "language_code" "LanguageCode" NOT NULL,
  "layout_id" TEXT NOT NULL,
  "first_char" TEXT NOT NULL,
  "second_char" TEXT NOT NULL,
  "total_presses" INTEGER NOT NULL DEFAULT 0,
  "total_errors" INTEGER NOT NULL DEFAULT 0,
  "average_latency_ms" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bigram_stats_pkey" PRIMARY KEY ("user_id", "language_code", "layout_id", "first_char", "second_char"),
  CONSTRAINT "bigram_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "bigram_stats_user_language_layout_errors_idx" ON "bigram_stats" ("user_id", "language_code", "layout_id", "total_errors");

CREATE TABLE "key_layout_stats" (
  "user_id" TEXT NOT NULL,
  "language_code" "LanguageCode" NOT NULL,
  "layout_id" TEXT NOT NULL,
  "key_char" TEXT NOT NULL,
  "total_presses" INTEGER NOT NULL DEFAULT 0,
  "total_errors" INTEGER NOT NULL DEFAULT 0,
  "error_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "key_layout_stats_pkey" PRIMARY KEY ("user_id", "language_code", "layout_id", "key_char"),
  CONSTRAINT "key_layout_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "key_layout_stats_user_language_layout_error_idx" ON "key_layout_stats" ("user_id", "language_code", "layout_id", "error_rate");
