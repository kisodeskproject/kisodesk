ALTER TABLE "lesson_attempts"
ADD COLUMN "client_session_id" TEXT;

CREATE UNIQUE INDEX "lesson_attempts_user_id_client_session_id_key"
ON "lesson_attempts"("user_id", "client_session_id");
