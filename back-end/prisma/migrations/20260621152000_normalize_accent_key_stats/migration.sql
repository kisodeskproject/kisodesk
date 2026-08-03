WITH accent_stats AS (
  SELECT
    "user_id",
    "language_code",
    SUM("total_presses")::int AS "total_presses",
    SUM("total_errors")::int AS "total_errors",
    MAX("last_error_at") AS "last_error_at",
    MAX("updated_at") AS "updated_at"
  FROM "key_stats"
  WHERE "key_char" IN ('á', 'é', 'í', 'ó', 'ú', 'Á', 'É', 'Í', 'Ó', 'Ú')
  GROUP BY "user_id", "language_code"
),
deleted AS (
  DELETE FROM "key_stats"
  WHERE "key_char" IN ('á', 'é', 'í', 'ó', 'ú', 'Á', 'É', 'Í', 'Ó', 'Ú')
)
INSERT INTO "key_stats" (
  "user_id",
  "language_code",
  "key_char",
  "total_presses",
  "total_errors",
  "error_rate",
  "last_error_at",
  "updated_at"
)
SELECT
  "user_id",
  "language_code",
  'acento',
  "total_presses",
  "total_errors",
  CASE
    WHEN "total_presses" > 0 THEN ("total_errors"::float / "total_presses"::float) * 100
    ELSE 0
  END,
  "last_error_at",
  "updated_at"
FROM accent_stats
ON CONFLICT ("user_id", "language_code", "key_char")
DO UPDATE SET
  "total_presses" = "key_stats"."total_presses" + EXCLUDED."total_presses",
  "total_errors" = "key_stats"."total_errors" + EXCLUDED."total_errors",
  "error_rate" = CASE
    WHEN ("key_stats"."total_presses" + EXCLUDED."total_presses") > 0
    THEN (("key_stats"."total_errors" + EXCLUDED."total_errors")::float / ("key_stats"."total_presses" + EXCLUDED."total_presses")::float) * 100
    ELSE 0
  END,
  "last_error_at" = CASE
    WHEN "key_stats"."last_error_at" IS NULL THEN EXCLUDED."last_error_at"
    WHEN EXCLUDED."last_error_at" IS NULL THEN "key_stats"."last_error_at"
    WHEN EXCLUDED."last_error_at" > "key_stats"."last_error_at" THEN EXCLUDED."last_error_at"
    ELSE "key_stats"."last_error_at"
  END,
  "updated_at" = CASE
    WHEN EXCLUDED."updated_at" > "key_stats"."updated_at" THEN EXCLUDED."updated_at"
    ELSE "key_stats"."updated_at"
  END;
