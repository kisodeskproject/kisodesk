ALTER TABLE "courses" ADD COLUMN "slug" TEXT;
ALTER TABLE "lessons" ADD COLUMN "slug" TEXT;

CREATE OR REPLACE FUNCTION slugify_text(input TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT trim(both '-' from regexp_replace(
    lower(
      translate(
        coalesce(input, ''),
        'áàäâãåéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
        'aaaaaaeeeeiiiiooooouuuuncaaaaaaeeeeiiiiooooouuuunc'
      )
    ),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
$$;

DO $$
DECLARE
  record_item RECORD;
  base_slug TEXT;
  candidate_slug TEXT;
  suffix_number INTEGER;
BEGIN
  FOR record_item IN SELECT id, name FROM "courses" ORDER BY created_at, id LOOP
    base_slug := slugify_text(record_item.name);
    IF base_slug = '' THEN
      base_slug := 'course';
    END IF;

    candidate_slug := base_slug;
    suffix_number := 2;

    WHILE EXISTS (
      SELECT 1
      FROM "courses"
      WHERE "slug" = candidate_slug
        AND id <> record_item.id
    ) LOOP
      candidate_slug := base_slug || '-' || suffix_number;
      suffix_number := suffix_number + 1;
    END LOOP;

    UPDATE "courses"
    SET "slug" = candidate_slug
    WHERE id = record_item.id;
  END LOOP;
END $$;

DO $$
DECLARE
  record_item RECORD;
  base_slug TEXT;
  candidate_slug TEXT;
  suffix_number INTEGER;
BEGIN
  FOR record_item IN
    SELECT id, title, description, content
    FROM "lessons"
    ORDER BY created_at, id
  LOOP
    base_slug := slugify_text(
      coalesce(nullif(record_item.title, ''), nullif(record_item.description, ''), record_item.content)
    );

    IF base_slug = '' THEN
      base_slug := 'lesson';
    END IF;

    candidate_slug := base_slug;
    suffix_number := 2;

    WHILE EXISTS (
      SELECT 1
      FROM "lessons"
      WHERE "slug" = candidate_slug
        AND id <> record_item.id
    ) LOOP
      candidate_slug := base_slug || '-' || suffix_number;
      suffix_number := suffix_number + 1;
    END LOOP;

    UPDATE "lessons"
    SET "slug" = candidate_slug
    WHERE id = record_item.id;
  END LOOP;
END $$;

ALTER TABLE "courses" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "lessons" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");

DROP FUNCTION slugify_text(TEXT);
