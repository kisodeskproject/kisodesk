CREATE TYPE "LessonActivityType" AS ENUM (
  'introduction',
  'guided_keys',
  'pattern_drill',
  'word_drill',
  'sentence_drill',
  'checkpoint',
  'review',
  'adaptive_review',
  'speed_test'
);

CREATE TYPE "LessonProgressStatus" AS ENUM (
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'MASTERED',
  'REVIEW_DUE'
);

ALTER TABLE "courses"
  ADD COLUMN "supported_layouts" "LayoutCode"[] NOT NULL DEFAULT ARRAY[]::"LayoutCode"[],
  ADD COLUMN "curriculum_version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "estimated_minutes" INTEGER;

ALTER TABLE "lessons"
  ADD COLUMN "activity_type" "LessonActivityType" NOT NULL DEFAULT 'pattern_drill',
  ADD COLUMN "objective" TEXT,
  ADD COLUMN "instructions" TEXT,
  ADD COLUMN "focus_keys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "review_keys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "allowed_characters" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "difficulty" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "estimated_seconds" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "min_accuracy" INTEGER NOT NULL DEFAULT 95,
  ADD COLUMN "max_target_key_errors" INTEGER,
  ADD COLUMN "required_successful_attempts" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "hide_live_wpm" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "course_lessons"
  ADD COLUMN "module_slug" TEXT,
  ADD COLUMN "module_title" TEXT,
  ADD COLUMN "module_description" TEXT,
  ADD COLUMN "module_order" INTEGER,
  ADD COLUMN "required" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "user_lesson_progress"
  ADD COLUMN "status" "LessonProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  ADD COLUMN "attempts_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "successful_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "latest_net_wpm" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "latest_accuracy" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "best_qualified_net_wpm" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "mastered_at" TIMESTAMP(3),
  ADD COLUMN "next_review_at" TIMESTAMP(3);

UPDATE "user_lesson_progress" AS progress
SET
  "status" = CASE
    WHEN lesson."type" = 'practice' THEN 'MASTERED'::"LessonProgressStatus"
    ELSE 'COMPLETED'::"LessonProgressStatus"
  END,
  "attempts_count" = 1,
  "successful_attempts" = 1,
  "latest_net_wpm" = progress."best_net_wpm",
  "latest_accuracy" = progress."best_accuracy",
  "best_qualified_net_wpm" = CASE
    WHEN lesson."type" = 'practice' THEN progress."best_net_wpm"
    ELSE 0
  END,
  "best_score" = progress."best_net_wpm" * 100,
  "mastered_at" = CASE
    WHEN lesson."type" = 'practice' THEN progress."achieved_at"
    ELSE NULL
  END,
  "next_review_at" = CASE
    WHEN lesson."type" = 'practice' THEN progress."achieved_at" + INTERVAL '3 days'
    ELSE NULL
  END
FROM "lessons" AS lesson
WHERE lesson."id" = progress."lesson_id";

CREATE TABLE "lesson_attempts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "lesson_id" TEXT NOT NULL,
  "net_wpm" INTEGER NOT NULL,
  "gross_wpm" INTEGER NOT NULL,
  "accuracy" INTEGER NOT NULL,
  "time_elapsed" INTEGER NOT NULL,
  "qualified" BOOLEAN NOT NULL DEFAULT false,
  "used_assistance" BOOLEAN NOT NULL DEFAULT false,
  "physical_events" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lesson_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lesson_attempts_user_id_created_at_idx"
  ON "lesson_attempts"("user_id", "created_at");

CREATE INDEX "lesson_attempts_lesson_id_idx"
  ON "lesson_attempts"("lesson_id");

CREATE INDEX "lesson_attempts_user_id_lesson_id_created_at_idx"
  ON "lesson_attempts"("user_id", "lesson_id", "created_at");

ALTER TABLE "lesson_attempts"
  ADD CONSTRAINT "lesson_attempts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lesson_attempts"
  ADD CONSTRAINT "lesson_attempts_lesson_id_fkey"
  FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
