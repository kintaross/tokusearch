#!/usr/bin/env node

/**
 * Googleスプレッドシート接続テストスクリプト
 * データ取得が正常に動作するか確認します
 */

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testConnection() {
  console.log('🔍 Googleスプレッドシート接続テスト開始\n');

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';

  console.log('📋 設定確認:');
  console.log(`   スプレッドシートID: ${spreadsheetId ? '✅ 設定済み' : '❌ 未設定'}`);
  console.log(`   APIキー: ${apiKey ? '✅ 設定済み' : '❌ 未設定'}`);
  console.log(`   サービスアカウント: ${serviceAccountKey ? '✅ 設定済み' : '❌ 未設定'}`);
  console.log(`   シート名: ${sheetName}\n`);

  if (!spreadsheetId) {
    console.error('❌ スプレッドシートIDが設定されていません');
    process.exit(1);
  }

  if (!apiKey && !serviceAccountKey) {
    console.error('❌ 認証情報が設定されていません');
    process.exit(1);
  }

  try {
    let sheets;
    
    if (serviceAccountKey) {
      console.log('🔐 サービスアカウントで認証中...');
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(serviceAccountKey),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ 認証成功\n');
    } else if (apiKey) {
      console.log('🔐 APIキーで認証中...');
      sheets = google.sheets({
        version: 'v4',
        auth: apiKey,
      });
      console.log('✅ 認証成功\n');
    }

    console.log(`📊 シート「${sheetName}」からデータを取得中...`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('⚠️  データが空です');
      console.log('   シート名が正しいか、データが入力されているか確認してください。\n');
      return;
    }

    console.log(`✅ データ取得成功: ${rows.length}行\n`);

    // ヘッダー行を表示
    if (rows.length > 0) {
      console.log('📋 ヘッダー行:');
      console.log(`   ${rows[0].join(' | ')}\n`);
    }

    // データ行の数を確認
    const dataRows = rows.slice(1);
    console.log(`📊 データ行数: ${dataRows.length}行\n`);

    // is_publicがTRUEの行をカウント
    const headers = rows[0];
    const isPublicIndex = headers.findIndex(h => h && h.toLowerCase() === 'is_public');
    
    if (isPublicIndex !== -1) {
      const publicRows = dataRows.filter(row => {
        const value = row[isPublicIndex];
        return value && value.toString().toUpperCase() === 'TRUE';
      });
      console.log(`✅ is_public=TRUE の行: ${publicRows.length}行\n`);
      
      if (publicRows.length === 0) {
        console.log('⚠️  警告: is_publicがTRUEのデータがありません');
        console.log('   スプレッドシートでis_publicカラムをTRUEに設定してください。\n');
      }
    } else {
      console.log('⚠️  警告: is_publicカラムが見つかりません');
      console.log('   ヘッダー行にis_publicカラムがあるか確認してください。\n');
    }

    // サンプルデータを表示（最初の3行）
    if (dataRows.length > 0) {
      console.log('📝 サンプルデータ（最初の3行）:');
      dataRows.slice(0, 3).forEach((row, index) => {
        console.log(`\n   行 ${index + 2}:`);
        headers.forEach((header, colIndex) => {
          if (header && row[colIndex]) {
            console.log(`     ${header}: ${row[colIndex]}`);
          }
        });
      });
      console.log('');
    }

    console.log('✅ テスト完了: 接続は正常です\n');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:\n');
    console.error(`   エラータイプ: ${error.constructor.name}`);
    console.error(`   メッセージ: ${error.message}\n`);

    if (error.message.includes('PERMISSION_DENIED') || error.message.includes('403')) {
      console.error('🔒 権限エラー:');
      console.error('   スプレッドシートにサービスアカウントを共有してください。');
      console.error(`   メールアドレス: tokusearch@reverberant-kit-475103-q0.iam.gserviceaccount.com\n`);
    } else if (error.message.includes('NOT_FOUND') || error.message.includes('404')) {
      console.error('🔍 見つからないエラー:');
      console.error(`   スプレッドシートIDまたはシート名「${sheetName}」が正しいか確認してください。\n`);
    } else if (error.message.includes('INVALID_ARGUMENT')) {
      console.error('📝 引数エラー:');
      console.error('   スプレッドシートIDまたはシート名の形式が正しくありません。\n');
    }

    console.error('詳細なエラー情報:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();

