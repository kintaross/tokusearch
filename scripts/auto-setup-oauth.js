#!/usr/bin/env node

/**
 * Google Drive API用のOAuth 2.0認証を自動設定するスクリプト
 * 
 * 使用方法:
 * node scripts/auto-setup-oauth.js
 * 
 * このスクリプトは以下を自動実行します:
 * 1. JSONファイルから認証情報を読み込み
 * 2. 認証URLを自動的にブラウザで開く
 * 3. 認証コードの入力を待つ
 * 4. リフレッシュトークンを取得
 * 5. Vercelに環境変数を自動設定
 */

const { google } = require('googleapis');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
  console.log('\n💡 以下のいずれかのJSONファイルをプロジェクトルートに配置してください:');
  console.log('   1. client_secret_tokusearch.json (推奨: TokuSearch用)');
  console.log('   2. Google Cloud Console でダウンロードした client_secret_*.json');
  console.log('\n📝 作成方法は docs/CREATE_TOKUSEARCH_OAUTH.md を参照してください。\n');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// 認証コードの入力を待つ関数
function askForAuthCode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('📝 認証コードを入力してください（リダイレクト後のURLの code= の後の文字列）: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ブラウザでURLを開く関数（クロスプラットフォーム対応）
function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' :
                'xdg-open';
  try {
    execSync(`${start} "${url}"`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 Google Drive API用のOAuth 2.0認証を自動設定します\n');

  // 認証URLを生成
  const scopes = [
    'https://www.googleapis.com/auth/drive',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  console.log('📋 認証URLを生成しました\n');
  console.log('🌐 ブラウザで認証URLを開いています...\n');

  // ブラウザで認証URLを開く
  if (openBrowser(authUrl)) {
    console.log('✅ ブラウザで認証URLを開きました\n');
  } else {
    console.log('⚠️ ブラウザを自動で開けませんでした。以下のURLを手動でブラウザで開いてください:\n');
    console.log(authUrl);
    console.log('\n');
  }

  console.log('📝 認証手順:');
  console.log('1. ブラウザでGoogleアカウントにログイン（必要に応じて）');
  console.log('2. 「許可」をクリック');
  console.log('3. リダイレクト後のURLから認証コードを取得');
  console.log('   URLの例: http://localhost:3000/oauth2callback?code=4/0AeanS...');
  console.log('4. 認証コード（code= の後の文字列、& の前まで）をコピー\n');

  // 認証コードの入力を待つ
  const authCode = await askForAuthCode();

  if (!authCode) {
    console.error('❌ 認証コードが入力されませんでした');
    process.exit(1);
  }

  console.log('\n🚀 リフレッシュトークンを取得中...\n');

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
    console.log('📦 Vercelに環境変数を自動設定中...\n');

    const environments = ['production', 'preview', 'development'];
    let successCount = 0;
    let failCount = 0;

    for (const env of environments) {
      try {
        console.log(`📦 ${env}環境に設定中...`);
        
        // 既存の環境変数を削除（エラーを無視）
        try {
          execSync(`vercel env rm GOOGLE_DRIVE_CLIENT_ID ${env} --yes`, { stdio: 'ignore' });
          execSync(`vercel env rm GOOGLE_DRIVE_CLIENT_SECRET ${env} --yes`, { stdio: 'ignore' });
          execSync(`vercel env rm GOOGLE_DRIVE_REFRESH_TOKEN ${env} --yes`, { stdio: 'ignore' });
        } catch (e) {
          // 既存の環境変数がない場合は無視
        }

        // 新しい環境変数を設定
        execSync(`echo ${CLIENT_ID} | vercel env add GOOGLE_DRIVE_CLIENT_ID ${env}`, {
          stdio: 'inherit',
          shell: true,
        });
        execSync(`echo ${CLIENT_SECRET} | vercel env add GOOGLE_DRIVE_CLIENT_SECRET ${env}`, {
          stdio: 'inherit',
          shell: true,
        });
        execSync(`echo ${refreshToken} | vercel env add GOOGLE_DRIVE_REFRESH_TOKEN ${env}`, {
          stdio: 'inherit',
          shell: true,
        });

        console.log(`✅ ${env}環境の設定が完了しました\n`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${env}環境の設定に失敗しました:`, error.message);
        failCount++;
      }
    }

    if (successCount > 0) {
      console.log(`\n✅ ${successCount}個の環境に環境変数を設定しました！\n`);
    }

    if (failCount > 0) {
      console.log(`\n⚠️ ${failCount}個の環境の設定に失敗しました。手動で設定してください。\n`);
      console.log('💡 手動で設定する場合:');
      console.log(`   vercel env add GOOGLE_DRIVE_CLIENT_ID production`);
      console.log(`   vercel env add GOOGLE_DRIVE_CLIENT_SECRET production`);
      console.log(`   vercel env add GOOGLE_DRIVE_REFRESH_TOKEN production\n`);
      console.log('上記の認証情報をコピーして、Vercelダッシュボードで設定してください。\n');
    }

    console.log('📝 次のステップ:');
    console.log('   1. 再デプロイを実行: vercel --prod --yes');
    console.log('   2. 管理画面で画像をアップロードしてテスト\n');

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

