import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import { AdminUser } from '@/types/column';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
const USERS_SHEET_NAME = 'admin_users';

async function getGoogleSheetsClient() {
  const credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// ユーザー一覧を取得
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USERS_SHEET_NAME}!A2:H`,
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      id: row[0] || '',
      username: row[1] || '',
      password_hash: row[2] || '',
      display_name: row[3] || '',
      email: row[4] || '',
      role: (row[5] || 'editor') as 'admin' | 'editor',
      created_at: row[6] || '',
      last_login: row[7] || '',
    }));
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}

// ユーザー名でユーザーを取得
export async function getUserByUsername(username: string): Promise<AdminUser | null> {
  const users = await fetchAdminUsers();
  return users.find((user) => user.username === username) || null;
}

// ユーザーIDでユーザーを取得
export async function getUserById(id: string): Promise<AdminUser | null> {
  const users = await fetchAdminUsers();
  return users.find((user) => user.id === id) || null;
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

  // 最終ログイン日時を更新
  await updateUserLastLogin(user.id);

  return user;
}

// 最終ログイン日時を更新
async function updateUserLastLogin(userId: string): Promise<void> {
  const sheets = await getGoogleSheetsClient();
  const users = await fetchAdminUsers();
  const index = users.findIndex((user) => user.id === userId);

  if (index === -1) {
    return;
  }

  const user = users[index];
  const now = new Date().toISOString();

  const row = [
    user.id,
    user.username,
    user.password_hash,
    user.display_name,
    user.email,
    user.role,
    user.created_at,
    now, // last_login
  ];

  const rowNumber = index + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${USERS_SHEET_NAME}!A${rowNumber}:H${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [row],
    },
  });
}

// ユーザーを作成
export async function createAdminUser(data: {
  username: string;
  password: string;
  display_name: string;
  email: string;
  role: 'admin' | 'editor';
}): Promise<AdminUser> {
  const sheets = await getGoogleSheetsClient();
  const now = new Date().toISOString();
  const id = `user-${Date.now()}`;
  const password_hash = await hashPassword(data.password);

  const newUser: AdminUser = {
    id,
    username: data.username,
    password_hash,
    display_name: data.display_name,
    email: data.email,
    role: data.role,
    created_at: now,
    last_login: '',
  };

  const row = [
    newUser.id,
    newUser.username,
    newUser.password_hash,
    newUser.display_name,
    newUser.email,
    newUser.role,
    newUser.created_at,
    newUser.last_login,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${USERS_SHEET_NAME}!A:H`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [row],
    },
  });

  return newUser;
}

