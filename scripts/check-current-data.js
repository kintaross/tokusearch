// 現在のデータ状態を確認するスクリプト
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const SHEET_NAME = process.env.GOOGLE_SHEETS_SHEET_NAME || 'database';

async function main() {
  console.log('📊 現在のデータ状態を確認中...\n');

  if (!SERVICE_ACCOUNT_KEY || !SPREADSHEET_ID) {
    throw new Error('必要な環境変数が設定されていません');
  }

  // Google Sheets認証
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // データ取得
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_NAME,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    console.log('データがありません');
    return;
  }

  const headers = rows[0];
  console.log(`📊 総データ件数: ${rows.length - 1}件\n`);

  // ヘッダー表示
  console.log(headers.join('\t'));
  console.log('');

  // データ表示
  rows.slice(1).forEach((row, index) => {
    console.log(row.join('\t'));
  });

  console.log(`\n✅ データ確認完了`);
}

main().catch(console.error);

