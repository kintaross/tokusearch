// 直近の新着お得をチェックするスクリプト
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const SHEET_NAME = process.env.GOOGLE_SHEETS_SHEET_NAME || 'database';

async function main() {
  console.log('📊 直近の新着お得をチェック中...\n');

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
  
  // ヘッダーマッピング
  const headerMap = {};
  headers.forEach((header, index) => {
    if (header) headerMap[header.toLowerCase().trim()] = index;
  });

  // データを整形（created_atでソート）
  const deals = rows.slice(1)
    .map((row, index) => ({
      rowNumber: index + 2,
      id: row[headerMap['id']] || '',
      title: row[headerMap['title']] || '',
      service: row[headerMap['service']] || '',
      expiration: row[headerMap['expiration']] || '',
      created_at: row[headerMap['created_at']] || '',
      discount_rate: row[headerMap['discount_rate']] || '',
      discount_amount: row[headerMap['discount_amount']] || '',
    }))
    .filter(deal => deal.created_at) // created_atがあるものだけ
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // 新しい順

  console.log(`📊 総データ件数: ${deals.length}件\n`);
  
  // 直近20件を表示
  console.log('📅 直近20件の新着お得:\n');
  console.log('Row\tID\t作成日時\tタイトル\tサービス');
  console.log('='.repeat(100));
  
  const recent20 = deals.slice(0, 20);
  recent20.forEach((deal, index) => {
    console.log(`${index + 1}. Row ${deal.rowNumber}\t${deal.id}\t${deal.created_at}\t${deal.title.substring(0, 30)}\t${deal.service}`);
  });

  // 重複チェック
  console.log('\n\n🔍 重複チェック...\n');
  
  const duplicates = [];
  const seen = new Map(); // id -> deal
  
  for (const deal of deals) {
    // Twitter IDベースのチェック
    if (deal.id.startsWith('x-')) {
      if (seen.has(deal.id)) {
        duplicates.push({
          type: 'Twitter ID重複',
          id: deal.id,
          existing: seen.get(deal.id),
          duplicate: deal,
        });
      } else {
        seen.set(deal.id, deal);
      }
    }
    
    // タイトル + サービス + 期限の組み合わせでチェック
    const normalizeText = (text) => {
      if (!text) return '';
      return text.toLowerCase()
        .replace(/[！!？?　\s\n]/g, '')
        .replace(/【.*?】/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/（.*?）/g, '')
        .trim();
    };
    
    const contentKey = `${normalizeText(deal.service)}|${normalizeText(deal.title)}|${deal.expiration}`;
    
    if (seen.has(contentKey)) {
      const existing = seen.get(contentKey);
      // 既存のものとIDが違う場合のみ重複として報告
      if (existing.id !== deal.id) {
        duplicates.push({
          type: '内容重複',
          key: contentKey.substring(0, 50),
          existing: existing,
          duplicate: deal,
        });
      }
    } else {
      seen.set(contentKey, deal);
    }
  }

  if (duplicates.length === 0) {
    console.log('✅ 重複データは検出されませんでした。');
  } else {
    console.log(`⚠️ ${duplicates.length}件の重複を検出しました:\n`);
    
    duplicates.forEach((dup, index) => {
      console.log(`\n【重複 ${index + 1}】 タイプ: ${dup.type}`);
      if (dup.type === 'Twitter ID重複') {
        console.log(`  ID: ${dup.id}`);
        console.log(`  既存: Row ${dup.existing.rowNumber} - ${dup.existing.title} (作成: ${dup.existing.created_at})`);
        console.log(`  重複: Row ${dup.duplicate.rowNumber} - ${dup.duplicate.title} (作成: ${dup.duplicate.created_at})`);
      } else {
        console.log(`  キー: ${dup.key}...`);
        console.log(`  既存: Row ${dup.existing.rowNumber} - ${dup.existing.id} - ${dup.existing.title} (作成: ${dup.existing.created_at})`);
        console.log(`  重複: Row ${dup.duplicate.rowNumber} - ${dup.duplicate.id} - ${dup.duplicate.title} (作成: ${dup.duplicate.created_at})`);
      }
    });
  }

  // 同じ日に作成されたものを確認
  console.log('\n\n📅 同じ日に作成されたデータをグループ化:\n');
  
  const byDate = new Map();
  deals.forEach(deal => {
    const date = deal.created_at.split('T')[0];
    if (!byDate.has(date)) {
      byDate.set(date, []);
    }
    byDate.get(date).push(deal);
  });

  // 最近の5日分を表示
  const sortedDates = Array.from(byDate.keys()).sort().reverse().slice(0, 5);
  
  sortedDates.forEach(date => {
    const dealsOnDate = byDate.get(date);
    console.log(`\n📆 ${date} (${dealsOnDate.length}件)`);
    dealsOnDate.forEach((deal, index) => {
      console.log(`  ${index + 1}. ${deal.id} - ${deal.title.substring(0, 40)} [${deal.service}]`);
    });
  });
}

main().catch(console.error);

