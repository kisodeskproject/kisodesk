ALTER TABLE "user_ranking_cache"
  ADD COLUMN "best_gross_wpm" INTEGER,
  ADD COLUMN "best_accuracy" INTEGER,
  ADD COLUMN "best_achieved_at" TIMESTAMP(3),
  ADD COLUMN "best_session_id" TEXT;

WITH ranked_sessions AS (
  SELECT
    ranked."user_id",
    ranked.scope,
    ranked."net_wpm",
    ranked."gross_wpm",
    ranked.accuracy,
    ranked."created_at",
    ranked.id
  FROM (
    SELECT
      ps.*,
      scope.scope,
      ROW_NUMBER() OVER (
        PARTITION BY ps."user_id", scope.scope
        ORDER BY ps."created_at" DESC, ps.id DESC
      ) AS window_position
    FROM "practice_sessions" ps
    CROSS JOIN LATERAL (VALUES (ps."language_code"::text), ('global')) AS scope(scope)
  ) ranked
  WHERE ranked.window_position <= 10
), best_attempts AS (
  SELECT DISTINCT ON ("user_id", scope)
    "user_id", scope, "net_wpm", "gross_wpm", accuracy, "created_at", id
  FROM ranked_sessions
  ORDER BY "user_id", scope, "net_wpm" DESC, "created_at" ASC, id ASC
)
UPDATE "user_ranking_cache" cache
SET
  "bestWpmNet" = best."net_wpm",
  "best_gross_wpm" = best."gross_wpm",
  "best_accuracy" = best.accuracy,
  "best_achieved_at" = best."created_at",
  "best_session_id" = best.id
FROM best_attempts best
WHERE cache."user_id" = best."user_id" AND cache."languageCode" = best.scope;

DELETE FROM "user_ranking_cache"
WHERE "best_gross_wpm" IS NULL;

ALTER TABLE "user_ranking_cache"
  DROP COLUMN "avgAccuracy",
  ALTER COLUMN "best_gross_wpm" SET NOT NULL,
  ALTER COLUMN "best_accuracy" SET NOT NULL,
  ALTER COLUMN "best_achieved_at" SET NOT NULL,
  ALTER COLUMN "best_session_id" SET NOT NULL;

CREATE INDEX "user_ranking_cache_languageCode_bestWpmNet_bestAchievedAt_user_id_idx"
  ON "user_ranking_cache"("languageCode", "bestWpmNet" DESC, "best_achieved_at", "user_id");

DROP INDEX "user_ranking_cache_languageCode_bestWpmNet_idx";
