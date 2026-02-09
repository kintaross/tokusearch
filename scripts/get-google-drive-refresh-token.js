#!/usr/bin/env node

/**
 * Google Drive API用のOAuth 2.0リフレッシュトークンを取得するスクリプト
 * 
 * 使用方法:
 * 1. Google Cloud ConsoleでOAuth 2.0認証情報を作成
 * 2. このスクリプトを実行
 * 3. ブラウザで認証URLにアクセス
 * 4. 認証コードを入力
 * 5. リフレッシュトークンを取得
 * 
 * 必要な環境変数:
 * - GOOGLE_DRIVE_CLIENT_ID: OAuth 2.0クライアントID
 * - GOOGLE_DRIVE_CLIENT_SECRET: OAuth 2.0クライアントシークレット
 */

const { google } = require('googleapis');
const readline = require('readline');
const http = require('http');
const url = require('url');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🚀 Google Drive API用のOAuth 2.0リフレッシュトークン取得\n');

  // 環境変数から認証情報を取得
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log('❌ 環境変数が設定されていません。');
    console.log('\n以下の環境変数を設定してください:');
    console.log('  GOOGLE_DRIVE_CLIENT_ID');
    console.log('  GOOGLE_DRIVE_CLIENT_SECRET');
    console.log('\nまたは、コマンドライン引数で指定してください。\n');
    
    const inputClientId = await question('OAuth 2.0クライアントID: ');
    const inputClientSecret = await question('OAuth 2.0クライアントシークレット: ');
    
    if (!inputClientId || !inputClientSecret) {
      console.log('❌ クライアントIDとクライアントシークレットは必須です。');
      rl.close();
      process.exit(1);
    }
    
    // 環境変数に設定（このセッションのみ）
    process.env.GOOGLE_DRIVE_CLIENT_ID = inputClientId;
    process.env.GOOGLE_DRIVE_CLIENT_SECRET = inputClientSecret;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId || process.env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret || process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  // スコープを設定
  const scopes = [
    'https://www.googleapis.com/auth/drive.file', // ファイルの作成・管理用
  ];

  // 認証URLを生成
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // リフレッシュトークンを取得するために必要
    scope: scopes,
    prompt: 'consent', // リフレッシュトークンを確実に取得するために必要
  });

  console.log('\n📝 以下の手順で認証を行ってください:\n');
  console.log('1. 以下のURLをブラウザで開いてください:');
  console.log(`\n   ${authUrl}\n`);
  console.log('2. Googleアカウントでログインし、アクセスを許可してください');
  console.log('3. リダイレクトされたページのURLから認証コードを取得してください');
  console.log('   （URLの `code=` の後の文字列）\n');

  const code = await question('認証コードを入力してください: ');

  if (!code || code.trim() === '') {
    console.log('❌ 認証コードは必須です。');
    rl.close();
    process.exit(1);
  }

  try {
    // 認証コードをトークンに交換
    const { tokens } = await oauth2Client.getToken(code.trim());
    
    if (!tokens.refresh_token) {
      console.log('\n⚠️ リフレッシュトークンが取得できませんでした。');
      console.log('   既に認証済みの場合は、Google Cloud Consoleで認証情報を削除してから再度試してください。');
      console.log(`\n   アクセストークン: ${tokens.access_token}`);
      rl.close();
      process.exit(1);
    }

    console.log('\n✅ リフレッシュトークンを取得しました！\n');
    console.log('以下の環境変数をVercelに設定してください:\n');
    console.log(`GOOGLE_DRIVE_CLIENT_ID=${clientId || process.env.GOOGLE_DRIVE_CLIENT_ID}`);
    console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${clientSecret || process.env.GOOGLE_DRIVE_CLIENT_SECRET}`);
    console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    console.log('Vercel CLIで設定する場合:');
    console.log(`  vercel env add GOOGLE_DRIVE_CLIENT_ID production`);
    console.log(`  vercel env add GOOGLE_DRIVE_CLIENT_SECRET production`);
    console.log(`  vercel env add GOOGLE_DRIVE_REFRESH_TOKEN production\n`);

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    rl.close();
    process.exit(1);
  }

  rl.close();
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  rl.close();
  process.exit(1);
});



