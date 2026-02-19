import bcrypt from 'bcryptjs';
import { AdminUser } from '@/types/column';
import { getDbPool } from '@/lib/db';
import {
  fetchAdminUsersFromDb,
  getUserByUsernameFromDb,
  getUserByIdFromDb,
  updateAdminUserLastLoginFromDb,
  createAdminUserInDb,
} from '@/lib/db-admin-users';

// ユーザー一覧を取得
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const pool = getDbPool();
  return fetchAdminUsersFromDb(pool);
}

// ユーザー名でユーザーを取得
export async function getUserByUsername(username: string): Promise<AdminUser | null> {
  const pool = getDbPool();
  return getUserByUsernameFromDb(pool, username);
}

// ユーザーIDでユーザーを取得
export async function getUserById(id: string): Promise<AdminUser | null> {
  const pool = getDbPool();
  return getUserByIdFromDb(pool, id);
}

// パスワード検証
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// パスワードハッシュ化
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// ユーザー認証
export async function authenticateUser(
  username: string,
  password: string
): Promise<AdminUser | null> {
  const user = await getUserByUsername(username);
  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  const pool = getDbPool();
  await updateAdminUserLastLoginFromDb(pool, user.id);

  return user;
}

// ユーザーを作成
export async function createAdminUser(data: {
  username: string;
  password: string;
  display_name: string;
  email: string;
  role: 'admin' | 'editor';
}): Promise<AdminUser> {
  const pool = getDbPool();
  const password_hash = await hashPassword(data.password);
  return createAdminUserInDb(pool, {
    username: data.username,
    password_hash,
    display_name: data.display_name,
    email: data.email,
    role: data.role,
  });
}
