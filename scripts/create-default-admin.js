require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const bcrypt = require('bcryptjs');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// デフォルト管理者情報
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  display_name: 'TokuSearch管理者',
  email: 'admin@tokusearch.local',
};

async function createDefaultAdmin() {
  try {
    console.log('👤 デフォルト管理者アカウントを作成します\n');
    console.log('--- デフォルト情報 ---');
    console.log(`ユーザー名: ${DEFAULT_ADMIN.username}`);
    console.log(`パスワード: ${DEFAULT_ADMIN.password}`);
    console.log(`表示名: ${DEFAULT_ADMIN.display_name}`);
    console.log(`メール: ${DEFAULT_ADMIN.email}`);
    console.log('\n⚠️  初回ログイン後、必ずパスワードを変更してください！\n');

    console.log('🔐 パスワードをハッシュ化中...');
    const password_hash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

    // 認証情報の設定
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const now = new Date().toISOString();
    const id = `user-${Date.now()}`;

    const row = [
      id,
      DEFAULT_ADMIN.username,
      password_hash,
      DEFAULT_ADMIN.display_name,
      DEFAULT_ADMIN.email,
      'admin',
      now,
      '',
    ];

    console.log('💾 Google Sheetsに保存中...');
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'admin_users!A:H',
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    console.log('\n✅ デフォルト管理者アカウントを作成しました！\n');
    console.log('--- ログイン情報 ---');
    console.log(`URL: http://localhost:3000/login`);
    console.log(`ユーザー名: ${DEFAULT_ADMIN.username}`);
    console.log(`パスワード: ${DEFAULT_ADMIN.password}`);
    console.log('\n⚠️  セキュリティのため、初回ログイン後にパスワードを変更してください！');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

createDefaultAdmin();

