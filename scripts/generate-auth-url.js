#!/usr/bin/env node

/**
 * Google Drive API用のOAuth 2.0認証URLを生成するスクリプト
 * 
 * 使用方法:
 * node scripts/generate-auth-url.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// OAuth 2.0認証情報をJSONファイルから読み込む
// 優先順位: 1. TokuSearch用JSON, 2. 既存のJSON, 3. フォールバック
const projectRoot = path.join(__dirname, '..');
const possibleFiles = [
  path.join(projectRoot, 'client_secret_tokusearch.json'),
  path.join(projectRoot, 'client_secret_277935949907-8rgmj2qlt8ok7bcnao0cbipk1v36vbun.apps.googleusercontent.com.json'),
];

let CLIENT_ID, CLIENT_SECRET, REDIRECT_URI;
let credentialsLoaded = false;
let isTokuSearch = false;

for (const filePath of possibleFiles) {
  try {
    if (fs.existsSync(filePath)) {
      const credentials = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      CLIENT_ID = credentials.web.client_id;
      CLIENT_SECRET = credentials.web.client_secret;
      REDIRECT_URI = credentials.web.redirect_uris[0];
      credentialsLoaded = true;
      
      // TokuSearch用のJSONファイルか確認
      if (path.basename(filePath).includes('tokusearch')) {
        isTokuSearch = true;
      }
      break;
    }
  } catch (error) {
    // 次のファイルを試す
  }
}

if (!credentialsLoaded) {
  console.error('❌ OAuth 2.0認証情報のJSONファイルが見つかりません\n');
  console.log('💡 TokuSearch用のOAuth 2.0クライアントIDを作成してください:');
  console.log('   node scripts/auto-create-oauth-complete.js\n');
  process.exit(1);
}

if (!isTokuSearch) {
  console.warn('⚠️ 警告: n8n用のクライアントIDが使用されています\n');
  console.log('💡 TokuSearch用のOAuth 2.0クライアントIDを作成することを推奨します:');
  console.log('   node scripts/auto-create-oauth-complete.js\n');
  console.log('現在のクライアントIDを使用して続行します...\n');
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/drive.file',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
});

console.log('\n🚀 Google Drive API用のOAuth 2.0認証URL\n');
console.log('以下のURLをブラウザで開いてください:\n');
console.log(authUrl);
console.log('\n📝 認証コードの取得手順:\n');
console.log('1. 上記のURLをブラウザで開く');
console.log('2. Googleアカウントでログイン（必要に応じて）');
console.log('3. 「TokuSearch Drive Upload が次の権限をリクエストしています」という画面が表示されます');
console.log('4. 「許可」をクリック');
console.log('5. リダイレクトされたページのURLを確認');
console.log('   URLの例: http://localhost:3000/oauth2callback?code=4/0AeanS...（長い文字列）');
console.log('6. URLの `code=` の後の文字列（`&` の前まで）をコピー');
console.log('   これが認証コードです\n');
console.log('⚠️ 注意: リダイレクト後、「このサイトに接続できません」というエラーが表示される場合がありますが、');
console.log('   これは正常です。URLバーから認証コードを取得してください。\n');

