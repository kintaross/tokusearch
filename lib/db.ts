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
      max: 10,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return global.__tokusearchPgPool;
}

/** 一過性（接続・タイムアウト系）のDBエラーか判定 */
function isTransientDbError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  if (code && ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'EHOSTUNREACH', '57P01', '08006', '08001', '08004'].includes(code)) {
    return true;
  }
  const msg = String((err as { message?: string })?.message ?? '').toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('connection terminated') ||
    msg.includes('connection closed') ||
    msg.includes('econnreset') ||
    msg.includes('too many clients') ||
    msg.includes('server closed the connection')
  );
}

/**
 * 冪等な読み取りクエリ向けのリトライ。
 * コールドスタートや瞬間的な接続断で最初のクエリが失敗するケースを吸収する。
 */
export async function withDbRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !isTransientDbError(err)) throw err;
      // 150ms, 300ms と線形バックオフ
      await new Promise((resolve) => setTimeout(resolve, 150 * (i + 1)));
    }
  }
  throw lastErr;
}

