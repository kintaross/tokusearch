import { Pool } from 'pg';
import { AdminUser } from '@/types/column';

function rowToAdminUser(r: {
  id: string;
  username: string;
  password_hash: string;
  display_name: string | null;
  email: string | null;
  role: string;
  created_at: string | null;
  last_login: string | null;
}): AdminUser {
  return {
    id: String(r.id),
    username: String(r.username),
    password_hash: String(r.password_hash),
    display_name: r.display_name ?? '',
    email: r.email ?? '',
    role: (r.role === 'admin' ? 'admin' : 'editor') as 'admin' | 'editor',
    created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
    last_login: r.last_login ? new Date(r.last_login).toISOString() : '',
  };
}

export async function fetchAdminUsersFromDb(pool: Pool): Promise<AdminUser[]> {
  const { rows } = await pool.query(
    `SELECT id, username, password_hash, display_name, email, role, created_at, last_login
     FROM admin_users ORDER BY created_at DESC NULLS LAST`
  );
  return rows.map(rowToAdminUser);
}

export async function getUserByUsernameFromDb(
  pool: Pool,
  username: string
): Promise<AdminUser | null> {
  const { rows } = await pool.query(
    `SELECT id, username, password_hash, display_name, email, role, created_at, last_login
     FROM admin_users WHERE username = $1 LIMIT 1`,
    [username]
  );
  return rows[0] ? rowToAdminUser(rows[0]) : null;
}

export async function getUserByIdFromDb(
  pool: Pool,
  id: string
): Promise<AdminUser | null> {
  const { rows } = await pool.query(
    `SELECT id, username, password_hash, display_name, email, role, created_at, last_login
     FROM admin_users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ? rowToAdminUser(rows[0]) : null;
}

export async function updateAdminUserLastLoginFromDb(
  pool: Pool,
  userId: string
): Promise<void> {
  await pool.query(
    `UPDATE admin_users SET last_login = NOW() WHERE id = $1`,
    [userId]
  );
}

export async function createAdminUserInDb(
  pool: Pool,
  data: {
    username: string;
    password_hash: string;
    display_name: string;
    email: string;
    role: 'admin' | 'editor';
  }
): Promise<AdminUser> {
  const id = `user-${Date.now()}`;
  const now = new Date().toISOString();
  const { rows } = await pool.query(
    `INSERT INTO admin_users (id, username, password_hash, display_name, email, role, created_at, last_login)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
     RETURNING id, username, password_hash, display_name, email, role, created_at, last_login`,
    [
      id,
      data.username,
      data.password_hash,
      data.display_name,
      data.email,
      data.role,
      now,
    ]
  );
  return rowToAdminUser(rows[0]);
}
