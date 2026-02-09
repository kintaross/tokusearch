require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createInitialAdmin() {
  try {
    console.log('👤 初期管理者アカウントを作成します\n');

    // ユーザー情報を入力
    const username = await question('ユーザー名: ');
    const password = await question('パスワード: ');
    const display_name = await question('表示名: ');
    const email = await question('メールアドレス: ');

    console.log('\n🔐 パスワードをハッシュ化中...');
    const password_hash = await bcrypt.hash(password, 10);

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
      username,
      password_hash,
      display_name,
      email,
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

    console.log('\n✅ 管理者アカウントを作成しました！');
    console.log('\n--- アカウント情報 ---');
    console.log(`ユーザー名: ${username}`);
    console.log(`表示名: ${display_name}`);
    console.log(`メール: ${email}`);
    console.log(`権限: admin`);
    console.log('\n管理画面にログインできます: /admin/login');

    rl.close();
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    rl.close();
    process.exit(1);
  }
}

createInitialAdmin();

