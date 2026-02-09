#!/usr/bin/env node

/**
 * 診断スクリプト
 * アプリケーションの動作を診断し、問題を特定します
 */

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function diagnose() {
  console.log('🔍 診断開始\n');
  
  // 1. 環境変数の確認
  console.log('1️⃣ 環境変数の確認');
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';
  
  console.log(`   スプレッドシートID: ${spreadsheetId ? '✅' : '❌'}`);
  console.log(`   サービスアカウント: ${serviceAccountKey ? '✅' : '❌'}`);
  console.log(`   シート名: ${sheetName}\n`);

  // 2. データ取得
  console.log('2️⃣ データ取得テスト');
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(serviceAccountKey),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const rows = response.data.values;
    console.log(`   ✅ データ取得成功: ${rows.length}行\n`);

    // 3. ヘッダーマッピング
    console.log('3️⃣ ヘッダーマッピング');
    const headers = rows[0];
    const headerMap = {};
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        headerMap[header.toLowerCase().trim()] = index;
      }
    });
    console.log(`   ヘッダー数: ${Object.keys(headerMap).length}`);
    console.log(`   ヘッダー: ${Object.keys(headerMap).join(', ')}\n`);

    // 4. データ行の処理
    console.log('4️⃣ データ行の処理');
    const isPublicIndex = headerMap['is_public'];
    const idIndex = headerMap['id'];
    const titleIndex = headerMap['title'];
    const dateIndex = headerMap['date'];
    
    let validCount = 0;
    let skippedPublic = 0;
    let skippedRequired = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const isPublic = row[isPublicIndex];
      const id = row[idIndex];
      const title = row[titleIndex];
      const date = row[dateIndex];

      if (isPublicIndex !== undefined && isPublic?.toString().toUpperCase() !== 'TRUE') {
        skippedPublic++;
        console.log(`   ⚠️ 行${i+1}: is_publicがTRUEではない (値: ${isPublic})`);
        continue;
      }

      if (!id || !title) {
        skippedRequired++;
        console.log(`   ⚠️ 行${i+1}: 必須項目が不足 (id: ${id}, title: ${title})`);
        continue;
      }

      validCount++;
      console.log(`   ✅ 行${i+1}: ${title} (日付: ${date})`);
    }

    console.log(`\n   有効データ: ${validCount}件`);
    console.log(`   スキップ(is_public): ${skippedPublic}件`);
    console.log(`   スキップ(必須項目): ${skippedRequired}件\n`);

    // 5. 日付フィルタのシミュレーション
    console.log('5️⃣ 日付フィルタのシミュレーション');
    const today = new Date().toISOString().split('T')[0];
    console.log(`   今日の日付: ${today}`);
    
    let todayCount = 0;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const date = row[dateIndex];
      const isPublic = row[isPublicIndex];
      const id = row[idIndex];
      const title = row[titleIndex];
      
      if (isPublic?.toString().toUpperCase() === 'TRUE' && id && title) {
        if (date === today) {
          todayCount++;
          console.log(`   ✅ 今日のデータ: ${title}`);
        } else {
          console.log(`   ⚠️ 今日ではない: ${title} (日付: ${date})`);
        }
      }
    }
    
    console.log(`\n   今日のデータ件数: ${todayCount}件\n`);

    // 6. 問題の診断
    console.log('6️⃣ 問題の診断');
    if (validCount === 0) {
      console.log('   ❌ 有効なデータが1件もありません');
      console.log('   原因: is_publicがTRUEでないか、必須項目が不足している');
    } else if (todayCount === 0) {
      console.log('   ⚠️ 今日の日付のデータが0件です');
      console.log('   原因: デフォルトのフィルタ「今日」で絞り込むとデータが表示されません');
      console.log('   解決策: URLパラメータ "?period=today" を削除してアクセスしてください');
      console.log('   または: http://localhost:3000?period=30days にアクセスしてください');
    } else {
      console.log('   ✅ データは正常に取得できています');
    }

    console.log('\n✅ 診断完了\n');

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

diagnose();


