ALTER TABLE "lessons"
  DROP COLUMN IF EXISTS "activity_type";

DROP TYPE IF EXISTS "LessonActivityType";
