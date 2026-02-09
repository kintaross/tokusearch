#!/usr/bin/env node

/**
 * リフレッシュトークンを取得してVercelに設定するスクリプト
 * 
 * 使用方法:
 * node scripts/set-refresh-token.js <認証コード>
 */

const { google } = require('googleapis');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// OAuth 2.0認証情報をJSONファイルから読み込む
const projectRoot = path.join(__dirname, '..');
const possibleFiles = [
  path.join(projectRoot, 'client_secret_tokusearch.json'),
  path.join(projectRoot, 'client_secret_277935949907-8rgmj2qlt8ok7bcnao0cbipk1v36vbun.apps.googleusercontent.com.json'),
];

let CLIENT_ID, CLIENT_SECRET, REDIRECT_URI;
let credentialsLoaded = false;

for (const filePath of possibleFiles) {
  try {
    if (fs.existsSync(filePath)) {
      const credentials = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      CLIENT_ID = credentials.web.client_id;
      CLIENT_SECRET = credentials.web.client_secret;
      REDIRECT_URI = credentials.web.redirect_uris[0];
      credentialsLoaded = true;
      break;
    }
  } catch (error) {
    // 次のファイルを試す
  }
}

if (!credentialsLoaded) {
  console.error('❌ OAuth 2.0認証情報のJSONファイルが見つかりません');
  process.exit(1);
}

const authCode = process.argv[2];

if (!authCode) {
  console.error('❌ 認証コードが指定されていません');
  console.log('使用方法: node scripts/set-refresh-token.js <認証コード>');
  process.exit(1);
}

async function main() {
  console.log('🚀 リフレッシュトークンを取得中...\n');

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  try {
    // 認証コードをトークンに交換
    const { tokens } = await oauth2Client.getToken(authCode);
    
    if (!tokens.refresh_token) {
      console.log('⚠️ リフレッシュトークンが取得できませんでした。');
      console.log('   既に認証済みの場合は、Google Cloud Consoleで認証情報を削除してから再度試してください。');
      process.exit(1);
    }

    const refreshToken = tokens.refresh_token;

    console.log('✅ リフレッシュトークンを取得しました！\n');
    console.log('📋 取得した認証情報:\n');
    console.log(`GOOGLE_DRIVE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}\n`);

    console.log('📝 以下のコマンドでVercelに環境変数を設定してください:\n');
    console.log(`vercel env add GOOGLE_DRIVE_CLIENT_ID production`);
    console.log(`vercel env add GOOGLE_DRIVE_CLIENT_SECRET production`);
    console.log(`vercel env add GOOGLE_DRIVE_REFRESH_TOKEN production\n`);
    console.log('または、Vercelダッシュボードから手動で設定してください。\n');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    if (error.response) {
      console.error('詳細:', error.response.data);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});



