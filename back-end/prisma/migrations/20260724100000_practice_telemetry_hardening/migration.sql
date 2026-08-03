ALTER TABLE "practice_sessions" ADD COLUMN "client_session_id" TEXT;
CREATE UNIQUE INDEX "practice_sessions_user_id_client_session_id_key"
  ON "practice_sessions" ("user_id", "client_session_id");
