ALTER TABLE "users"
  ADD COLUMN "public_alias" TEXT,
  ADD COLUMN "show_in_ranking" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "searchable_by_alias" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "show_presence_to_friends" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "share_stats_with_friends" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "allow_friend_requests" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "users_public_alias_key"
  ON "users"("public_alias");
