import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __tokusearchPgPool: Pool | undefined;
}

/**
 * Postgres connection pool.
 *
 * Required env:
 * - DATABASE_URL (Vercel Postgres / Supabase / Neon 等)
 */
export function getDbPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!global.__tokusearchPgPool) {
    global.__tokusearchPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // serverless環境でのコネクション枯渇を避けるため控えめに
      max: 2,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return global.__tokusearchPgPool;
}

