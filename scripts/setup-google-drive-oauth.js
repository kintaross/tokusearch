#!/usr/bin/env node

/**
 * Google Drive API用のOAuth 2.0認証情報を一括セットアップするスクリプト
 * 
 * 使用方法:
 * node scripts/setup-google-drive-oauth.js
 * 
 * このスクリプトは以下を実行します:
 * 1. OAuth 2.0クライアントID/シークレットの入力
 * 2. リフレッシュトークンの取得
 * 3. Vercelへの環境変数設定（オプション）
 */

const { google } = require('googleapis');
const { execSync } = require('child_process');
const readline = require('readline');

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
  console.log('🚀 Google Drive API用のOAuth 2.0認証情報セットアップ\n');
  console.log('このスクリプトは以下を実行します:');
  console.log('1. OAuth 2.0クライアントID/シークレットの入力');
  console.log('2. リフレッシュトークンの取得');
  console.log('3. Vercelへの環境変数設定（オプション）\n');

  // ステップ1: OAuth 2.0クライアントID/シークレットの入力
  console.log('📝 ステップ1: OAuth 2.0認証情報の入力\n');
  console.log('Google Cloud ConsoleでOAuth 2.0認証情報を作成していない場合:');
  console.log('1. https://console.cloud.google.com/ にアクセス');
  console.log('2. プロジェクトを選択');
  console.log('3. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuth クライアント ID」');
  console.log('4. アプリケーションの種類: 「ウェブアプリケーション」');
  console.log('5. 承認済みのリダイレクト URI に以下を追加:');
  console.log('   - http://localhost:3000/oauth2callback（開発用）');
  console.log('   - https://tokusearch.vercel.app/oauth2callback（本番用）');
  console.log('   - カスタムドメインがある場合: https://yourdomain.com/oauth2callback');
  console.log('6. 作成後、クライアントIDとシークレットをコピー\n');

  const clientId = await question('OAuth 2.0クライアントID: ');
  if (!clientId || clientId.trim() === '') {
    console.log('❌ クライアントIDは必須です。');
    rl.close();
    process.exit(1);
  }

  const clientSecret = await question('OAuth 2.0クライアントシークレット: ');
  if (!clientSecret || clientSecret.trim() === '') {
    console.log('❌ クライアントシークレットは必須です。');
    rl.close();
    process.exit(1);
  }

  // ステップ2: リフレッシュトークンの取得
  console.log('\n📝 ステップ2: リフレッシュトークンの取得\n');

  const oauth2Client = new google.auth.OAuth2(
    clientId.trim(),
    clientSecret.trim(),
    'http://localhost:3000/oauth2callback'
  );

  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  console.log('以下の手順で認証を行ってください:\n');
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
    const { tokens } = await oauth2Client.getToken(code.trim());
    
    if (!tokens.refresh_token) {
      console.log('\n⚠️ リフレッシュトークンが取得できませんでした。');
      console.log('   既に認証済みの場合は、Google Cloud Consoleで認証情報を削除してから再度試してください。');
      rl.close();
      process.exit(1);
    }

    const refreshToken = tokens.refresh_token;

    console.log('\n✅ リフレッシュトークンを取得しました！\n');

    // ステップ3: Vercelへの環境変数設定
    console.log('📝 ステップ3: Vercelへの環境変数設定\n');
    const setupVercel = await question('Vercelに環境変数を自動設定しますか？ (y/N): ');

    if (setupVercel.toLowerCase() === 'y') {
      try {
        console.log('\n⏳ Vercelに環境変数を設定中...\n');

        // Production環境
        console.log('📦 Production環境に設定中...');
        execSync(`echo ${clientId.trim()} | vercel env add GOOGLE_DRIVE_CLIENT_ID production`, {
          stdio: 'inherit',
          shell: true,
        });
        execSync(`echo ${clientSecret.trim()} | vercel env add GOOGLE_DRIVE_CLIENT_SECRET production`, {
          stdio: 'inherit',
          shell: true,
        });
        execSync(`echo ${refreshToken} | vercel env add GOOGLE_DRIVE_REFRESH_TOKEN production`, {
          stdio: 'inherit',
          shell: true,
        });

        // Preview環境
        console.log('\n📦 Preview環境に設定中...');
        execSync(`echo ${clientId.trim()} | vercel env add GOOGLE_DRIVE_CLIENT_ID preview`, {
          stdio: 'inherit',
          shell: true,
        });
        execSync(`echo ${clientSecret.trim()} | vercel env add GOOGLE_DRIVE_CLIENT_SECRET preview`, {
          stdio: 'inherit',
          shell: true,
        });
        execSync(`echo ${refreshToken} | vercel env add GOOGLE_DRIVE_REFRESH_TOKEN preview`, {
          stdio: 'inherit',
          shell: true,
        });

        // Development環境
        console.log('\n📦 Development環境に設定中...');
        execSync(`echo ${clientId.trim()} | vercel env add GOOGLE_DRIVE_CLIENT_ID development`, {
          stdio: 'inherit',
          shell: true,
        });
        execSync(`echo ${clientSecret.trim()} | vercel env add GOOGLE_DRIVE_CLIENT_SECRET development`, {
          stdio: 'inherit',
          shell: true,
        });
        execSync(`echo ${refreshToken} | vercel env add GOOGLE_DRIVE_REFRESH_TOKEN development`, {
          stdio: 'inherit',
          shell: true,
        });

        console.log('\n✅ Vercelへの環境変数設定が完了しました！\n');
        console.log('📝 次のステップ:');
        console.log('   1. 再デプロイを実行: vercel --prod --yes');
        console.log('   2. 管理画面で画像をアップロードしてテスト\n');

      } catch (error) {
        console.error('\n❌ Vercelへの環境変数設定に失敗しました:', error.message);
        console.log('\n💡 手動で設定する場合:');
        console.log('   vercel env add GOOGLE_DRIVE_CLIENT_ID production');
        console.log('   vercel env add GOOGLE_DRIVE_CLIENT_SECRET production');
        console.log('   vercel env add GOOGLE_DRIVE_REFRESH_TOKEN production\n');
      }
    } else {
      console.log('\n📝 手動でVercelに環境変数を設定する場合:\n');
      console.log('Vercel CLI:');
      console.log(`  vercel env add GOOGLE_DRIVE_CLIENT_ID production`);
      console.log(`  vercel env add GOOGLE_DRIVE_CLIENT_SECRET production`);
      console.log(`  vercel env add GOOGLE_DRIVE_REFRESH_TOKEN production\n`);
      console.log('または、Vercelダッシュボードから:');
      console.log('  Settings → Environment Variables → Add New\n');
    }

    // 環境変数の値を表示
    console.log('📋 取得した認証情報:\n');
    console.log(`GOOGLE_DRIVE_CLIENT_ID=${clientId.trim()}`);
    console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${clientSecret.trim()}`);
    console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}\n`);

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

