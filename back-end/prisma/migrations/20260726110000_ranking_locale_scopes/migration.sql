-- Reconstruye la caché de rankings por locale de interfaz.
-- El ámbito global continúa usando las últimas diez sesiones de cualquier locale.
DELETE FROM "user_ranking_cache";

WITH ranked_sessions AS (
  SELECT
    id,
    user_id,
    locale_code AS scope,
    net_wpm,
    gross_wpm,
    accuracy,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, locale_code
      ORDER BY created_at DESC, id DESC
    ) AS recent_position
  FROM "practice_sessions"
), recent_sessions AS (
  SELECT * FROM ranked_sessions WHERE recent_position <= 10
), best_sessions AS (
  SELECT DISTINCT ON (user_id, scope)
    id,
    user_id,
    scope,
    net_wpm,
    gross_wpm,
    accuracy,
    created_at
  FROM recent_sessions
  ORDER BY user_id, scope, net_wpm DESC, created_at ASC, id ASC
), session_counts AS (
  SELECT user_id, scope, COUNT(*)::integer AS total_sessions_used
  FROM recent_sessions
  GROUP BY user_id, scope
)
INSERT INTO "user_ranking_cache" (
  user_id,
  "languageCode",
  "bestWpmNet",
  best_gross_wpm,
  best_accuracy,
  best_achieved_at,
  best_session_id,
  "totalSessionsUsed",
  "updatedAt"
)
SELECT
  best.user_id,
  best.scope,
  best.net_wpm,
  best.gross_wpm,
  best.accuracy,
  best.created_at,
  best.id,
  counts.total_sessions_used,
  NOW()
FROM best_sessions best
JOIN session_counts counts
  ON counts.user_id = best.user_id AND counts.scope = best.scope;

WITH ranked_sessions AS (
  SELECT
    id,
    user_id,
    net_wpm,
    gross_wpm,
    accuracy,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY created_at DESC, id DESC
    ) AS recent_position
  FROM "practice_sessions"
), recent_sessions AS (
  SELECT * FROM ranked_sessions WHERE recent_position <= 10
), best_sessions AS (
  SELECT DISTINCT ON (user_id)
    id,
    user_id,
    net_wpm,
    gross_wpm,
    accuracy,
    created_at
  FROM recent_sessions
  ORDER BY user_id, net_wpm DESC, created_at ASC, id ASC
), session_counts AS (
  SELECT user_id, COUNT(*)::integer AS total_sessions_used
  FROM recent_sessions
  GROUP BY user_id
)
INSERT INTO "user_ranking_cache" (
  user_id,
  "languageCode",
  "bestWpmNet",
  best_gross_wpm,
  best_accuracy,
  best_achieved_at,
  best_session_id,
  "totalSessionsUsed",
  "updatedAt"
)
SELECT
  best.user_id,
  'global',
  best.net_wpm,
  best.gross_wpm,
  best.accuracy,
  best.created_at,
  best.id,
  counts.total_sessions_used,
  NOW()
FROM best_sessions best
JOIN session_counts counts ON counts.user_id = best.user_id;
