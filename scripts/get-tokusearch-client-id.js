#!/usr/bin/env node

/**
 * TokuSearch用のOAuth 2.0クライアントIDを取得するスクリプト
 * 
 * Google Cloud Consoleで「TokuSearch」という名前のOAuth 2.0クライアントIDを探します
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PROJECT_ID = 'reverberant-kit-475103-q0';
const CLIENT_NAME = 'TokuSearch';

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
  console.log('🔍 TokuSearch用のOAuth 2.0クライアントIDを確認します\n');

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

  console.log('📝 以下の手順でTokuSearch用のOAuth 2.0クライアントIDを確認してください:\n');
  console.log('1. 開いたブラウザで「OAuth 2.0 クライアント ID」の一覧を確認');
  console.log(`2. 名前が「${CLIENT_NAME}」のクライアントIDを探す`);
  console.log('3. 見つかったら、そのクライアントIDとシークレットをコピー\n');

  const hasClientId = await askQuestion('TokuSearch用のOAuth 2.0クライアントIDが見つかりましたか？ (y/N): ');

  if (hasClientId.toLowerCase() !== 'y') {
    console.log('\n📝 TokuSearch用のOAuth 2.0クライアントIDを作成してください:\n');
    console.log('1. 「認証情報を作成」→「OAuth 2.0 クライアント ID」');
    console.log('2. アプリケーションの種類: 「ウェブアプリケーション」');
    console.log(`3. 名前: ${CLIENT_NAME}`);
    console.log('4. 承認済みのリダイレクト URI:');
    console.log('   - http://localhost:3000/oauth2callback');
    console.log('   - https://tokusearch.vercel.app/oauth2callback');
    console.log('5. 「作成」をクリック\n');
    console.log('作成後、再度このスクリプトを実行してください。\n');
    process.exit(0);
  }

  console.log('\n📝 TokuSearch用のOAuth 2.0クライアントIDの情報を入力してください:\n');

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
      redirect_uris: [
        'http://localhost:3000/oauth2callback',
        'https://tokusearch.vercel.app/oauth2callback',
      ],
    },
  };

  const outputPath = path.join(__dirname, '..', 'client_secret_tokusearch.json');
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

  console.log(`\n✅ JSONファイルを作成しました: ${outputPath}\n`);
  console.log('📝 次のステップ:');
  console.log('   node scripts/generate-auth-url.js\n');
  console.log('これで認証画面に「TokuSearch」が表示されるようになります。\n');
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});



