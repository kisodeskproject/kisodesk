-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('es', 'en');

-- CreateEnum
CREATE TYPE "LayoutCode" AS ENUM ('QWERTY_US', 'QWERTY_ES', 'AZERTY', 'DVORAK');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('practice', 'explanatory');

-- CreateEnum
CREATE TYPE "ErrorSessionType" AS ENUM ('LESSON', 'PRACTICE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "interface_language" "LanguageCode",
    "language" "LanguageCode",
    "country_code" TEXT,
    "country_name" TEXT,
    "layout" "LayoutCode",
    "accessibility" JSONB,
    "best_gross_wpm" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language_code" "LanguageCode" NOT NULL,
    "level" "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "type" "LessonType" NOT NULL DEFAULT 'practice',
    "description" TEXT,
    "fingerPositions" JSONB,
    "targetKeys" JSONB,
    "mediaUrl" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_lessons" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "course_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lesson_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "best_net_wpm" INTEGER NOT NULL,
    "best_gross_wpm" INTEGER NOT NULL,
    "best_accuracy" INTEGER NOT NULL,
    "time_elapsed" INTEGER NOT NULL,
    "best_score" INTEGER NOT NULL,
    "achieved_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "typing_errors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT,
    "practice_session_id" TEXT,
    "expected_char" TEXT NOT NULL,
    "typed_char" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "typing_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT,
    "practice_session_id" TEXT,
    "type" "ErrorSessionType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "total_keystrokes" INTEGER NOT NULL,
    "total_errors" INTEGER NOT NULL,
    "net_wpm" INTEGER NOT NULL,
    "gross_wpm" INTEGER NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_stats" (
    "user_id" TEXT NOT NULL,
    "language_code" "LanguageCode" NOT NULL,
    "key_char" TEXT NOT NULL,
    "total_presses" INTEGER NOT NULL DEFAULT 0,
    "total_errors" INTEGER NOT NULL DEFAULT 0,
    "error_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_error_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_stats_pkey" PRIMARY KEY ("user_id","language_code","key_char")
);

-- CreateTable
CREATE TABLE "practice_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "net_wpm" INTEGER NOT NULL,
    "gross_wpm" INTEGER NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "time_elapsed" INTEGER NOT NULL,
    "language_code" "LanguageCode" NOT NULL,
    "layout_id" TEXT,
    "practice_text_id" TEXT,
    "keystrokes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_texts" (
    "id" TEXT NOT NULL,
    "language_code" "LanguageCode" NOT NULL,
    "content" TEXT NOT NULL,
    "character_set" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_texts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ranking_cache" (
    "user_id" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "bestWpmNet" INTEGER NOT NULL,
    "avgAccuracy" DOUBLE PRECISION NOT NULL,
    "totalSessionsUsed" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ranking_cache_pkey" PRIMARY KEY ("user_id","languageCode")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "course_lessons_course_id_order_key" ON "course_lessons"("course_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "course_lessons_course_id_lesson_id_key" ON "course_lessons"("course_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_lesson_progress_user_id_lesson_id_key" ON "user_lesson_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "typing_errors_user_id_idx" ON "typing_errors"("user_id");

-- CreateIndex
CREATE INDEX "typing_errors_user_id_created_at_idx" ON "typing_errors"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "typing_errors_user_id_expected_char_idx" ON "typing_errors"("user_id", "expected_char");

-- CreateIndex
CREATE INDEX "typing_errors_lesson_id_idx" ON "typing_errors"("lesson_id");

-- CreateIndex
CREATE INDEX "typing_errors_practice_session_id_idx" ON "typing_errors"("practice_session_id");

-- CreateIndex
CREATE INDEX "error_sessions_user_id_idx" ON "error_sessions"("user_id");

-- CreateIndex
CREATE INDEX "error_sessions_user_id_created_at_idx" ON "error_sessions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "error_sessions_lesson_id_idx" ON "error_sessions"("lesson_id");

-- CreateIndex
CREATE INDEX "error_sessions_practice_session_id_idx" ON "error_sessions"("practice_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "error_sessions_practice_session_id_key" ON "error_sessions"("practice_session_id");

-- CreateIndex
CREATE INDEX "key_stats_user_id_language_code_idx" ON "key_stats"("user_id", "language_code");

-- CreateIndex
CREATE INDEX "practice_sessions_user_id_idx" ON "practice_sessions"("user_id");

-- CreateIndex
CREATE INDEX "practice_sessions_created_at_idx" ON "practice_sessions"("created_at");

-- CreateIndex
CREATE INDEX "practice_sessions_user_id_language_code_created_at_idx" ON "practice_sessions"("user_id", "language_code", "created_at");

-- CreateIndex
CREATE INDEX "practice_sessions_user_id_created_at_idx" ON "practice_sessions"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "user_ranking_cache_languageCode_bestWpmNet_idx" ON "user_ranking_cache"("languageCode", "bestWpmNet" DESC);

-- AddForeignKey
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typing_errors" ADD CONSTRAINT "typing_errors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typing_errors" ADD CONSTRAINT "typing_errors_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typing_errors" ADD CONSTRAINT "typing_errors_practice_session_id_fkey" FOREIGN KEY ("practice_session_id") REFERENCES "practice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_sessions" ADD CONSTRAINT "error_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_sessions" ADD CONSTRAINT "error_sessions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_sessions" ADD CONSTRAINT "error_sessions_practice_session_id_fkey" FOREIGN KEY ("practice_session_id") REFERENCES "practice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_stats" ADD CONSTRAINT "key_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_practice_text_id_fkey" FOREIGN KEY ("practice_text_id") REFERENCES "practice_texts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ranking_cache" ADD CONSTRAINT "user_ranking_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
