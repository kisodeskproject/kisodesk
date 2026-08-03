// /src/config/database.ts
export function buildDatabaseUrl(): string {
  const host = process.env.POSTGRES_HOST ?? 'localhost';
  const port = process.env.POSTGRES_PORT ?? '5432';
  const db = process.env.POSTGRES_DB ?? 'typing';
  const user = process.env.POSTGRES_USER ?? 'typing';
  const pass = process.env.POSTGRES_PASSWORD;
  if (!pass) throw new Error('POSTGRES_PASSWORD must be configured');

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(
    pass,
  )}@${host}:${port}/${db}?schema=public`;
}

// Establece DATABASE_URL si no viene definida
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = buildDatabaseUrl();
}
