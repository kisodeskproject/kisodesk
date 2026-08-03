CREATE TABLE "daily_anonymous_analytics" (
  "day" DATE NOT NULL,
  "anonymous_sessions" INTEGER NOT NULL DEFAULT 0,
  "page_views" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_anonymous_analytics_pkey" PRIMARY KEY ("day")
);
