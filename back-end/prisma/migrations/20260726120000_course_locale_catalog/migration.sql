ALTER TABLE "courses"
ADD COLUMN "locale_code" TEXT NOT NULL DEFAULT 'es-latam';

UPDATE "courses"
SET "locale_code" = CASE
  WHEN "slug" IN ('caracteres-alfabeticos-es', 'curso-ortografia-es', 'english-foundations-a1-a2') THEN 'es-latam'
  WHEN "language_code"::text = 'es' THEN 'es-ES'
  WHEN "language_code"::text = 'en' THEN 'en-US'
  WHEN "language_code"::text = 'pt' THEN 'pt-BR'
  ELSE "language_code"::text
END;
