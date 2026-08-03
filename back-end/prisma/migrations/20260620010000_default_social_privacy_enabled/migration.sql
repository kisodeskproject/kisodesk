UPDATE "users"
SET "public_alias" = 'user_' || substring(replace("id", '-', '') from 1 for 25)
WHERE "public_alias" IS NULL;

UPDATE "users"
SET
  "show_in_ranking" = true,
  "searchable_by_alias" = true,
  "show_presence_to_friends" = true,
  "share_stats_with_friends" = true,
  "allow_friend_requests" = true;

ALTER TABLE "users"
  ALTER COLUMN "show_in_ranking" SET DEFAULT true,
  ALTER COLUMN "searchable_by_alias" SET DEFAULT true,
  ALTER COLUMN "show_presence_to_friends" SET DEFAULT true,
  ALTER COLUMN "share_stats_with_friends" SET DEFAULT true,
  ALTER COLUMN "allow_friend_requests" SET DEFAULT true;
