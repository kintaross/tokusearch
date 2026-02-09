#!/usr/bin/env node

/**
 * TokuSearch用のOAuth 2.0クライアントIDを可能な限り自動で作成するスクリプト
 * 
 * 注意: Google Cloud Console APIにはOAuth 2.0クライアントIDを直接作成するAPIが存在しないため、
 * 完全自動化は不可能です。このスクリプトは可能な限り自動化します。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const PROJECT_ID = 'reverberant-kit-475103-q0';
const CLIENT_NAME = 'TokuSearch';
const REDIRECT_URIS = [
  'http://localhost:3000/oauth2callback',
  'https://tokusearch.vercel.app/oauth2callback',
];
const OUTPUT_FILE = path.join(__dirname, '..', 'client_secret_tokusearch.json');

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
  console.log('🚀 TokuSearch用のOAuth 2.0クライアントIDを自動作成します\n');

  // 既存のJSONファイルを確認
  if (fs.existsSync(OUTPUT_FILE)) {
    console.log('✅ 既存のJSONファイルが見つかりました\n');
    const use = await askQuestion('既存のファイルを使用しますか？ (Y/n): ');
    if (use.toLowerCase() !== 'n') {
      console.log('\n✅ 既存のJSONファイルを使用します\n');
      console.log('📝 次のステップ:');
      console.log('   node scripts/auto-setup-oauth.js\n');
      return;
    }
  }

  // Google Cloud Consoleを開く
  const consoleUrl = `https://console.cloud.google.com/apis/credentials/consent?project=${PROJECT_ID}`;
  console.log('📋 Google Cloud ConsoleのOAuth同意画面を開いています...\n');

  if (openBrowser(consoleUrl)) {
    console.log('✅ ブラウザでGoogle Cloud Consoleを開きました\n');
  } else {
    console.log('⚠️ ブラウザを自動で開けませんでした。以下のURLを手動で開いてください:\n');
    console.log(consoleUrl);
    console.log('\n');
  }

  // 認証情報ページも開く
  const credentialsUrl = `https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}`;
  setTimeout(() => {
    openBrowser(credentialsUrl);
  }, 2000);

  console.log('📝 以下の手順でOAuth 2.0クライアントIDを作成してください:\n');
  console.log('1. 開いたブラウザで「OAuth同意画面」を設定（初回のみ）');
  console.log('   - アプリ名: TokuSearch');
  console.log('   - ユーザーサポートメール: あなたのメールアドレス');
  console.log('   - デベロッパーの連絡先情報: あなたのメールアドレス');
  console.log('   - 「保存して次へ」をクリック');
  console.log('2. 「認証情報」タブに移動');
  console.log('3. 「認証情報を作成」→「OAuth 2.0 クライアント ID」');
  console.log('4. アプリケーションの種類: 「ウェブアプリケーション」');
  console.log(`5. 名前: ${CLIENT_NAME}`);
  console.log('6. 承認済みのリダイレクト URI に以下を追加:');
  REDIRECT_URIS.forEach(uri => console.log(`   - ${uri}`));
  console.log('7. 「作成」をクリック');
  console.log('8. 表示されたクライアントIDとシークレットをコピー\n');

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

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jsonData, null, 2));

  console.log(`\n✅ JSONファイルを作成しました: ${OUTPUT_FILE}\n`);
  console.log('📝 次のステップ:');
  console.log('   node scripts/auto-setup-oauth.js\n');
  console.log('これで認証画面に「TokuSearch」が表示され、リフレッシュトークンを取得できます。\n');
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});



