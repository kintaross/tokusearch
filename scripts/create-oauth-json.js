#!/usr/bin/env node

/**
 * OAuth 2.0クライアントIDの情報からJSONファイルを自動作成するスクリプト
 * 
 * 使用方法:
 * node scripts/create-oauth-json.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// プロジェクト情報
const PROJECT_ID = 'reverberant-kit-475103-q0';
const REDIRECT_URIS = [
  'http://localhost:3000/oauth2callback',
  'https://tokusearch.vercel.app/oauth2callback',
];

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

// 質問を表示して回答を取得
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🚀 TokuSearch用のOAuth 2.0クライアントIDのJSONファイルを作成します\n');

  // Google Cloud Consoleを開く
  const consoleUrl = `https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}`;
  console.log('📋 Google Cloud Consoleの認証情報ページを開いています...\n');

  if (openBrowser(consoleUrl)) {
    console.log('✅ ブラウザでGoogle Cloud Consoleを開きました\n');
  } else {
    console.log('⚠️ ブラウザを自動で開けませんでした。以下のURLを手動で開いてください:\n');
    console.log(consoleUrl);
    console.log('\n');
  }

  console.log('📝 以下の手順でOAuth 2.0クライアントIDを作成してください:\n');
  console.log('1. 「認証情報を作成」→「OAuth 2.0 クライアント ID」をクリック');
  console.log('2. アプリケーションの種類: 「ウェブアプリケーション」を選択');
  console.log('3. 名前: 「TokuSearch」を入力');
  console.log('4. 承認済みのリダイレクト URI に以下を追加:');
  REDIRECT_URIS.forEach(uri => console.log(`   - ${uri}`));
  console.log('5. 「作成」をクリック');
  console.log('6. 表示されたクライアントIDとシークレットをコピー\n');

  const proceed = await askQuestion('OAuth 2.0クライアントIDを作成しましたか？ (y/N): ');
  
  if (proceed.toLowerCase() !== 'y') {
    console.log('\n❌ キャンセルしました。');
    console.log('OAuth 2.0クライアントIDを作成してから、再度このスクリプトを実行してください。\n');
    process.exit(0);
  }

  console.log('\n📝 作成したOAuth 2.0クライアントIDの情報を入力してください:\n');

  const clientId = await askQuestion('クライアントID: ');
  const clientSecret = await askQuestion('クライアントシークレット: ');

  if (!clientId || !clientSecret) {
    console.error('\n❌ クライアントIDとシークレットは必須です');
    process.exit(1);
  }

  // JSONファイルを作成
  const jsonData = {
    web: {
      client_id: clientId,
      project_id: PROJECT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_secret: clientSecret,
      redirect_uris: REDIRECT_URIS,
    },
  };

  const outputPath = path.join(__dirname, '..', 'client_secret_tokusearch.json');
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

  console.log(`\n✅ JSONファイルを作成しました: ${outputPath}\n`);
  console.log('📝 次のステップ:');
  console.log('   node scripts/auto-setup-oauth.js\n');
  console.log('これで認証画面に「TokuSearch」が表示されるようになります。\n');
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});



