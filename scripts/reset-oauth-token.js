#!/usr/bin/env node

/**
 * Google Drive API用のOAuth 2.0リフレッシュトークンを再取得するスクリプト
 * 
 * 使用方法:
 * 1. node scripts/reset-oauth-token.js
 * 2. 表示されたURLをブラウザで開く
 * 3. 認証コードを取得して、このスクリプトに引数として渡す
 *    node scripts/reset-oauth-token.js <認証コード>
 */

const { google } = require('googleapis');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// OAuth 2.0認証情報をJSONファイルから読み込む
// 優先順位: 1. TokuSearch用JSON, 2. 既存のJSON, 3. フォールバック
const projectRoot = path.join(__dirname, '..');
const possibleFiles = [
  path.join(projectRoot, 'client_secret_tokusearch.json'),
  ...(process.env.GOOGLE_OAUTH_JSON_PATH ? [path.resolve(projectRoot, process.env.GOOGLE_OAUTH_JSON_PATH)] : []),
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
      console.log(`✅ OAuth 2.0認証情報をJSONファイルから読み込みました: ${path.basename(filePath)}\n`);
      credentialsLoaded = true;
      break;
    }
  } catch (error) {
    console.warn(`⚠️ ${path.basename(filePath)} の読み込みに失敗しました:`, error.message);
  }
}

if (!credentialsLoaded) {
  console.error('❌ JSONファイルが見つかりませんでした。');
  console.log('\n💡 client_secret_tokusearch.json または client_secret_*.json をプロジェクトルートに配置してください。');
  console.log('   docs/CREATE_TOKUSEARCH_OAUTH.md を参照してください。\n');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

async function main() {
  const authCode = process.argv[2];

  if (!authCode) {
    // 認証URLを生成
    const scopes = [
      'https://www.googleapis.com/auth/drive',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // 常に新しいリフレッシュトークンを取得
    });

    console.log('\n🚀 Google Drive API用のOAuth 2.0認証URL\n');
    console.log('以下のURLをブラウザで開いてください:\n');
    console.log(authUrl);
    console.log('\n📝 認証コードの取得手順:\n');
    console.log('1. 上記のURLをブラウザで開く');
    console.log('2. Googleアカウントでログイン（必要に応じて）');
    console.log('3. 「許可」をクリック');
    console.log('4. リダイレクト後のURLから認証コードを取得');
    console.log('   URLの例: http://localhost:3000/oauth2callback?code=4/0AeanS...');
    console.log('5. 認証コード（code= の後の文字列）をコピー\n');
    console.log('6. 以下のコマンドを実行:');
    console.log(`   node scripts/reset-oauth-token.js <認証コード>\n`);
    return;
  }

  console.log('🚀 リフレッシュトークンを取得中...\n');

  try {
    // 認証コードをトークンに交換
    const { tokens } = await oauth2Client.getToken(authCode);
    
    if (!tokens.refresh_token) {
      console.log('⚠️ リフレッシュトークンが取得できませんでした。');
      console.log('   既に認証済みの場合は、Google Cloud Consoleで認証情報を削除してから再度試してください。');
      if (tokens.access_token) {
        console.log(`\n   アクセストークン: ${tokens.access_token}`);
      }
      process.exit(1);
    }

    const refreshToken = tokens.refresh_token;

    console.log('✅ リフレッシュトークンを取得しました！\n');
    console.log('📋 取得した認証情報:\n');
    console.log(`GOOGLE_DRIVE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}\n`);

    // Vercelに環境変数を設定
    console.log('📦 Vercelに環境変数を設定中...\n');

    try {
      // Production環境
      console.log('📦 Production環境に設定中...');
      execSync(`echo ${CLIENT_ID} | vercel env add GOOGLE_DRIVE_CLIENT_ID production`, {
        stdio: 'inherit',
        shell: true,
      });
      execSync(`echo ${CLIENT_SECRET} | vercel env add GOOGLE_DRIVE_CLIENT_SECRET production`, {
        stdio: 'inherit',
        shell: true,
      });
      execSync(`echo ${refreshToken} | vercel env add GOOGLE_DRIVE_REFRESH_TOKEN production`, {
        stdio: 'inherit',
        shell: true,
      });

      // Preview環境
      console.log('\n📦 Preview環境に設定中...');
      execSync(`echo ${CLIENT_ID} | vercel env add GOOGLE_DRIVE_CLIENT_ID preview`, {
        stdio: 'inherit',
        shell: true,
      });
      execSync(`echo ${CLIENT_SECRET} | vercel env add GOOGLE_DRIVE_CLIENT_SECRET preview`, {
        stdio: 'inherit',
        shell: true,
      });
      execSync(`echo ${refreshToken} | vercel env add GOOGLE_DRIVE_REFRESH_TOKEN preview`, {
        stdio: 'inherit',
        shell: true,
      });

      // Development環境
      console.log('\n📦 Development環境に設定中...');
      execSync(`echo ${CLIENT_ID} | vercel env add GOOGLE_DRIVE_CLIENT_ID development`, {
        stdio: 'inherit',
        shell: true,
      });
      execSync(`echo ${CLIENT_SECRET} | vercel env add GOOGLE_DRIVE_CLIENT_SECRET development`, {
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
      console.log(`   vercel env add GOOGLE_DRIVE_CLIENT_ID production`);
      console.log(`   vercel env add GOOGLE_DRIVE_CLIENT_SECRET production`);
      console.log(`   vercel env add GOOGLE_DRIVE_REFRESH_TOKEN production\n`);
      console.log('上記の認証情報をコピーして、Vercelダッシュボードで設定してください。\n');
    }

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    if (error.response) {
      console.error('詳細:', error.response.data);
    }
    console.log('\n💡 トラブルシューティング:');
    console.log('1. 認証コードが正しいか確認してください');
    console.log('2. 認証コードは一度しか使用できません。新しい認証コードを取得してください');
    console.log('3. Google Cloud ConsoleでOAuth 2.0認証情報が正しく設定されているか確認してください\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});

