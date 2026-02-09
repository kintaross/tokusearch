// AI（Gemini）による重複チェック・削除スクリプト
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const SHEET_NAME = process.env.GOOGLE_SHEETS_SHEET_NAME || 'database';

async function main() {
  console.log('🤖 AI重複チェック開始...\n');

  if (!SERVICE_ACCOUNT_KEY || !SPREADSHEET_ID || !GEMINI_API_KEY) {
    throw new Error('必要な環境変数が設定されていません');
  }

  // Google Sheets認証
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
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

  // ヘッダーマッピング
  const headerMap = {};
  headers.forEach((header, index) => {
    if (header) headerMap[header.toLowerCase().trim()] = index;
  });

  // データを整形
  const dealsData = rows.slice(1).map((row, index) => ({
    index,
    rowNumber: index + 2, // スプレッドシートの行番号（ヘッダー含む）
    id: row[headerMap['id']] || '',
    date: row[headerMap['date']] || '',
    title: row[headerMap['title']] || '',
    summary: row[headerMap['summary']] || '',
    service: row[headerMap['service']] || '',
    expiration: row[headerMap['expiration']] || '',
    detail: (row[headerMap['detail']] || '').substring(0, 200),
    conditions: row[headerMap['conditions']] || '',
    discount_rate: row[headerMap['discount_rate']] || '',
    discount_amount: row[headerMap['discount_amount']] || '',
    created_at: row[headerMap['created_at']] || '',
  }));

  // Gemini API初期化
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
以下は「TokuSearch」に登録されたお得情報のデータです。
この中から、**明らかに重複している情報**を特定し、削除すべきデータのインデックス番号を配列で返してください。

【重複判定基準（厳密に適用）】
1. **同一ID（x-数字）**: 同じTwitter投稿IDなら100%重複 → created_atが新しい方を削除
2. **サービス名 + タイトルの実質的一致**: 表現が少し違っても内容が同じなら重複 → created_atが新しい方を削除
   - 例：「ヤフーショッピングブラックフライデーセール」と「Yahoo!ショッピングBF」→重複
3. **有効期限が一致**: サービス名+タイトルが似ていて、期限も同じなら重複 → created_atが新しい方を削除
4. **還元率/割引額が異なる**: 同じサービスでも率・額が違えば別キャンペーン（別件として残す）
5. **対象ユーザー条件が異なる**: 同じサービスでも「新規限定」vs「誰でも」なら別件（別件として残す）
6. **期限が異なる**: 同じサービス・同じ内容でも期限が違えば別キャンペーン（別件として残す）

【重要ルール】
- 重複の場合、**created_atが古い方を残し、新しい方を削除**
- 削除すべきデータのインデックス番号のみを純粋なJSON配列で返す
- 説明・コメント・マークダウン記法は一切不要

【入力データ】
${JSON.stringify(dealsData, null, 2)}

【返却形式】：削除すべきデータのインデックス番号の配列をJSONで返してください
例: [5, 12, 18, 23]
※ 説明・コメント・マークダウン記法は一切不要です
`.trim();

  console.log('🤖 Gemini AIで重複判定中（数分かかる場合があります）...\n');
  
  const result = await model.generateContent(prompt);
  const geminiResponse = result.response;
  const text = geminiResponse.text();
  
  // JSONをパース
  const jsonString = text
    .replace(/^```json\s*/m, '')
    .replace(/```$/m, '')
    .trim();

  let indicesToDelete;
  try {
    indicesToDelete = JSON.parse(jsonString);
  } catch (e) {
    console.error('❌ Gemini出力のパースに失敗:', text);
    throw e;
  }

  if (!Array.isArray(indicesToDelete)) {
    console.error('❌ Gemini出力が配列ではありません:', jsonString);
    return;
  }

  console.log(`📊 AI判定結果: ${indicesToDelete.length}件の重複を検出\n`);

  if (indicesToDelete.length === 0) {
    console.log('✅ 重複データはありません。');
    
    // 全データを表示
    console.log('\n📋 全データ（重複なし）:\n');
    console.log(headers.join('\t'));
    rows.slice(1).forEach(row => {
      console.log(row.join('\t'));
    });
    return;
  }

  // 削除対象の詳細表示
  console.log('⚠️  削除対象:\n');
  indicesToDelete.forEach(index => {
    const deal = dealsData[index];
    console.log(`  [${index}] Row ${deal.rowNumber}: ${deal.id} - "${deal.title}" (created: ${deal.created_at})`);
  });

  // 削除実行（行番号の大きい順）
  console.log('\n🗑️  削除実行中...\n');
  
  const sortedIndices = indicesToDelete.sort((a, b) => b - a);
  
  for (const index of sortedIndices) {
    const deal = dealsData[index];
    const rowNumber = deal.rowNumber;
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:Z${rowNumber}`,
    });
    
    console.log(`✅ 削除完了: Row ${rowNumber} - "${deal.title}"`);
  }

  // 空行を削除（シートを再取得して詰める）
  console.log('\n🔄 空行を削除中...\n');
  
  const updatedResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_NAME,
  });

  const updatedRows = updatedResponse.data.values || [];
  const nonEmptyRows = updatedRows.filter(row => row && row.some(cell => cell && cell.trim() !== ''));

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_NAME,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: nonEmptyRows,
    },
  });

  console.log(`✅ 重複削除完了！ ${indicesToDelete.length}件のデータを削除しました。`);
  
  // 削除後のデータを表示
  console.log('\n📋 削除後のデータ一覧:\n');
  console.log(headers.join('\t'));
  nonEmptyRows.slice(1).forEach(row => {
    console.log(row.join('\t'));
  });

  console.log(`\n📊 残りのデータ件数: ${nonEmptyRows.length - 1}件`);
}

main().catch(console.error);
