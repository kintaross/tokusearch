#!/usr/bin/env node

/**
 * 認証コードからリフレッシュトークンを取得し、Vercelに設定するスクリプト
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
      credentialsLoaded = true;
      break;
    }
  } catch (error) {
    // 次のファイルを試す
  }
}

if (!credentialsLoaded) {
  console.error('❌ JSONファイルが見つかりませんでした。');
  console.log('\n💡 client_secret_tokusearch.json または client_secret_*.json をプロジェクトルートに配置してください。');
  console.log('   docs/CREATE_TOKUSEARCH_OAUTH.md を参照してください。\n');
  process.exit(1);
}

// 認証コードをコマンドライン引数または環境変数から取得
const AUTH_CODE = process.argv[2] || process.env.AUTH_CODE;

if (!AUTH_CODE) {
  console.error('❌ 認証コードが指定されていません。\n');
  console.log('使用方法:');
  console.log('  node scripts/get-refresh-token-with-code.js <認証コード>');
  console.log('  または');
  console.log('  AUTH_CODE=<認証コード> node scripts/get-refresh-token-with-code.js\n');
  console.log('認証コードの取得方法:');
  console.log('  1. node scripts/generate-auth-url.js を実行');
  console.log('  2. 表示されたURLをブラウザで開く');
  console.log('  3. リダイレクト後のURLから code= の後の文字列をコピー\n');
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
    const { tokens } = await oauth2Client.getToken(AUTH_CODE);
    
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
      console.log('📋 取得した認証情報:\n');
      console.log(`GOOGLE_DRIVE_CLIENT_ID=${CLIENT_ID}`);
      console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${CLIENT_SECRET}`);
      console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}\n`);
    }

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

