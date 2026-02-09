#!/usr/bin/env node

/**
 * TokuSearch用のOAuth 2.0クライアントIDを自動作成するスクリプト
 * 
 * 使用方法:
 * node scripts/create-tokusearch-oauth.js
 * 
 * 前提条件:
 * - Google Cloud Consoleでサービスアカウントの認証情報が必要
 * - または、gcloud CLIがインストールされている
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// プロジェクト情報
const PROJECT_ID = 'reverberant-kit-475103-q0';
const CLIENT_NAME = 'TokuSearch';
const REDIRECT_URIS = [
  'http://localhost:3000/oauth2callback',
  'https://tokusearch.vercel.app/oauth2callback',
];

// 認証コードの入力を待つ関数
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

async function createOAuthClient() {
  console.log('🚀 TokuSearch用のOAuth 2.0クライアントIDを自動作成します\n');

  // 認証方法を選択
  console.log('📋 認証方法を選択してください:');
  console.log('   1. サービスアカウント（推奨）');
  console.log('   2. gcloud CLI');
  console.log('   3. 手動で作成（Google Cloud Console）\n');

  const method = await askQuestion('選択 (1/2/3): ');

  if (method === '3') {
    console.log('\n📝 手動で作成する場合の手順:');
    console.log('1. https://console.cloud.google.com/apis/credentials にアクセス');
    console.log('2. 「認証情報を作成」→「OAuth 2.0 クライアント ID」');
    console.log('3. アプリケーションの種類: 「ウェブアプリケーション」');
    console.log(`4. 名前: ${CLIENT_NAME}`);
    console.log('5. 承認済みのリダイレクト URI:');
    REDIRECT_URIS.forEach(uri => console.log(`   - ${uri}`));
    console.log('6. 「作成」をクリック');
    console.log('7. 表示されたクライアントIDとシークレットをコピー\n');
    console.log('その後、以下のコマンドでJSONファイルを作成できます:');
    console.log('   node scripts/create-oauth-json.js\n');
    return;
  }

  if (method === '1') {
    // サービスアカウントを使用
    console.log('\n📝 サービスアカウントのJSONキーのパスを入力してください:');
    const keyPath = await askQuestion('JSONキーのパス: ');

    if (!keyPath || !fs.existsSync(keyPath)) {
      console.error('❌ JSONキーファイルが見つかりません');
      process.exit(1);
    }

    try {
      const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      const auth = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      const authClient = await auth.getClient();
      const projectId = await auth.getProjectId();

      console.log(`\n✅ 認証成功: プロジェクトID ${projectId}\n`);

      // OAuth 2.0クライアントIDを作成
      // 注意: Google Cloud Console APIには直接OAuth 2.0クライアントIDを作成するAPIがないため、
      // gcloud CLIを使用するか、手動で作成する必要があります
      console.log('⚠️ Google Cloud Console APIにはOAuth 2.0クライアントIDを直接作成するAPIがありません。');
      console.log('gcloud CLIを使用するか、手動で作成してください。\n');
      console.log('gcloud CLIを使用する場合:');
      console.log(`   gcloud auth application-default login`);
      console.log(`   gcloud config set project ${PROJECT_ID}`);
      console.log(`   gcloud alpha iap oauth-clients create ${CLIENT_NAME} --display-name="${CLIENT_NAME}"`);
      console.log('\nまたは、手動で作成してください（方法3）。\n');

    } catch (error) {
      console.error('❌ 認証エラー:', error.message);
      process.exit(1);
    }
  } else if (method === '2') {
    // gcloud CLIを使用
    const { execSync } = require('child_process');
    
    console.log('\n📝 gcloud CLIを使用してOAuth 2.0クライアントIDを作成します\n');

    try {
      // gcloud CLIがインストールされているか確認
      execSync('gcloud --version', { stdio: 'ignore' });
      
      console.log('✅ gcloud CLIが見つかりました\n');
      console.log('⚠️ 注意: gcloud CLIにはOAuth 2.0クライアントIDを直接作成するコマンドがありません。');
      console.log('Google Cloud ConsoleのWeb UIを使用して作成してください。\n');
      console.log('手順:');
      console.log('1. https://console.cloud.google.com/apis/credentials にアクセス');
      console.log('2. 「認証情報を作成」→「OAuth 2.0 クライアント ID」');
      console.log('3. アプリケーションの種類: 「ウェブアプリケーション」');
      console.log(`4. 名前: ${CLIENT_NAME}`);
      console.log('5. 承認済みのリダイレクト URI:');
      REDIRECT_URIS.forEach(uri => console.log(`   - ${uri}`));
      console.log('6. 「作成」をクリック\n');

    } catch (error) {
      console.error('❌ gcloud CLIが見つかりません');
      console.log('gcloud CLIをインストールしてください: https://cloud.google.com/sdk/docs/install\n');
      process.exit(1);
    }
  }
}

// JSONファイル作成ヘルパー
async function createJSONFile() {
  console.log('\n📝 OAuth 2.0クライアントIDの情報を入力してください:\n');

  const clientId = await askQuestion('クライアントID: ');
  const clientSecret = await askQuestion('クライアントシークレット: ');

  if (!clientId || !clientSecret) {
    console.error('❌ クライアントIDとシークレットは必須です');
    process.exit(1);
  }

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
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-json')) {
    await createJSONFile();
  } else {
    await createOAuthClient();
  }
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});



