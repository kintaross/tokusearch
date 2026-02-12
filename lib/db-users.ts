import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface AppUser {
  id: string;
  google_sub: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

/**
 * Google OAuth の sub でユーザーを検索。いなければ作成して返す。
 */
export async function findOrCreateUserByGoogle(
  pool: Pool,
  profile: { sub: string; email?: string | null; name?: string | null; image?: string | null }
): Promise<AppUser> {
  const existing = await pool.query<AppUser>(
    `SELECT id, google_sub, email, name, avatar_url, created_at, updated_at, last_login_at
     FROM users WHERE google_sub = $1`,
    [profile.sub]
  );
  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE users SET updated_at = NOW(), last_login_at = NOW(), email = COALESCE($2, email), name = COALESCE($3, name), avatar_url = COALESCE($4, avatar_url) WHERE id = $1`,
      [existing.rows[0].id, profile.email ?? null, profile.name ?? null, profile.image ?? null]
    );
    const updated = await pool.query<AppUser>(
      `SELECT id, google_sub, email, name, avatar_url, created_at, updated_at, last_login_at FROM users WHERE id = $1`,
      [existing.rows[0].id]
    );
    return updated.rows[0];
  }
  const id = `u-${uuidv4()}`;
  await pool.query(
    `INSERT INTO users (id, google_sub, email, name, avatar_url, created_at, updated_at, last_login_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
    [id, profile.sub, profile.email ?? null, profile.name ?? null, profile.image ?? null]
  );
  const created = await pool.query<AppUser>(
    `SELECT id, google_sub, email, name, avatar_url, created_at, updated_at, last_login_at FROM users WHERE id = $1`,
    [id]
  );
  return created.rows[0];
}

export async function getUserById(pool: Pool, userId: string): Promise<AppUser | null> {
  const r = await pool.query<AppUser>(
    `SELECT id, google_sub, email, name, avatar_url, created_at, updated_at, last_login_at FROM users WHERE id = $1`,
    [userId]
  );
  return r.rows[0] ?? null;
}

/** アカウントと関連データを削除（CASCADE で子テーブルも削除） */
export async function deleteUser(pool: Pool, userId: string): Promise<boolean> {
  const r = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  return r.rowCount !== null && r.rowCount > 0;
}
