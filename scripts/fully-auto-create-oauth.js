#!/usr/bin/env node

/**
 * TokuSearch用のOAuth 2.0クライアントIDを完全自動で作成するスクリプト
 * 
 * 使用方法:
 * node scripts/fully-auto-create-oauth.js
 */

const { google } = require('googleapis');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// プロジェクト情報
const PROJECT_ID = 'reverberant-kit-475103-q0';
const CLIENT_NAME = 'TokuSearch';
const REDIRECT_URIS = [
  'http://localhost:3000/oauth2callback',
  'https://tokusearch.vercel.app/oauth2callback',
];

const OUTPUT_FILE = path.join(__dirname, '..', 'client_secret_tokusearch.json');

// gcloud CLIを使用してOAuth 2.0クライアントIDを作成
async function createWithGcloud() {
  console.log('🚀 gcloud CLIを使用してOAuth 2.0クライアントIDを作成します\n');

  try {
    // gcloud CLIがインストールされているか確認
    execSync('gcloud --version', { stdio: 'ignore' });
    console.log('✅ gcloud CLIが見つかりました\n');

    // プロジェクトを設定
    console.log(`📋 プロジェクトを設定中: ${PROJECT_ID}`);
    execSync(`gcloud config set project ${PROJECT_ID}`, { stdio: 'inherit' });

    // OAuth 2.0クライアントIDを作成
    // 注意: gcloud CLIには直接OAuth 2.0クライアントIDを作成するコマンドがないため、
    // Google Cloud Console APIを使用する必要があります
    console.log('\n⚠️ gcloud CLIにはOAuth 2.0クライアントIDを直接作成するコマンドがありません。');
    console.log('Google Cloud Console APIを使用して作成します。\n');

    return false;
  } catch (error) {
    console.error('❌ gcloud CLIが見つかりません');
    return false;
  }
}

// Google Cloud Console APIを使用してOAuth 2.0クライアントIDを作成
async function createWithAPI() {
  console.log('🚀 Google Cloud Console APIを使用してOAuth 2.0クライアントIDを作成します\n');

  // サービスアカウントの認証情報を探す
  const possibleKeyFiles = [
    path.join(__dirname, '..', 'reverberant-kit-475103-q0-3ba90e3e958e.json'),
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : null,
  ].filter(Boolean);

  let auth;
  for (const keyFile of possibleKeyFiles) {
    try {
      if (typeof keyFile === 'string' && fs.existsSync(keyFile)) {
        const key = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
        auth = new google.auth.GoogleAuth({
          credentials: key,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        break;
      } else if (typeof keyFile === 'object') {
        auth = new google.auth.GoogleAuth({
          credentials: keyFile,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        break;
      }
    } catch (error) {
      // 次のファイルを試す
    }
  }

  if (!auth) {
    console.error('❌ サービスアカウントの認証情報が見つかりません');
    console.log('💡 環境変数 GOOGLE_SERVICE_ACCOUNT_KEY を設定するか、');
    console.log('   サービスアカウントのJSONキーファイルを配置してください。\n');
    return false;
  }

  try {
    const authClient = await auth.getClient();
    const projectId = await auth.getProjectId();
    console.log(`✅ 認証成功: プロジェクトID ${projectId}\n`);

    // 注意: Google Cloud Console APIにはOAuth 2.0クライアントIDを直接作成するAPIがありません
    // そのため、IAM Credentials APIや他のAPIを使用する必要がありますが、
    // 実際にはOAuth 2.0クライアントIDの作成はWeb UIを通じて行う必要があります

    console.log('⚠️ Google Cloud Console APIにはOAuth 2.0クライアントIDを直接作成するAPIがありません。');
    console.log('代替方法として、既存のクライアントIDを確認するか、手動で作成する必要があります。\n');

    return false;
  } catch (error) {
    console.error('❌ API認証エラー:', error.message);
    return false;
  }
}

// 既存のクライアントIDを確認
async function checkExistingClient() {
  console.log('🔍 既存のOAuth 2.0クライアントIDを確認中...\n');

  // 既存のJSONファイルを確認
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      console.log('✅ 既存のJSONファイルが見つかりました:');
      console.log(`   クライアントID: ${existing.web.client_id}\n`);
      
      const use = await askQuestion('既存のクライアントIDを使用しますか？ (Y/n): ');
      if (use.toLowerCase() !== 'n') {
        return existing.web.client_id;
      }
    } catch (error) {
      // 無視
    }
  }

  return null;
}

// 質問を表示して回答を取得
function askQuestion(question) {
  const readline = require('readline');
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

// 完全自動でOAuth 2.0クライアントIDを作成（Google Cloud Console API経由）
async function createOAuthClientAutomatically() {
  console.log('🚀 TokuSearch用のOAuth 2.0クライアントIDを完全自動で作成します\n');

  // 既存のクライアントIDを確認
  const existingClientId = await checkExistingClient();
  if (existingClientId) {
    console.log('✅ 既存のクライアントIDを使用します\n');
    return;
  }

  // 方法1: gcloud CLIを試す
  const gcloudSuccess = await createWithGcloud();
  if (gcloudSuccess) {
    return;
  }

  // 方法2: Google Cloud Console APIを試す
  const apiSuccess = await createWithAPI();
  if (apiSuccess) {
    return;
  }

  // 方法3: 手動作成を案内（最後の手段）
  console.log('📝 自動作成ができませんでした。以下の手順で手動で作成してください:\n');
  console.log('1. https://console.cloud.google.com/apis/credentials にアクセス');
  console.log('2. 「認証情報を作成」→「OAuth 2.0 クライアント ID」');
  console.log('3. アプリケーションの種類: 「ウェブアプリケーション」');
  console.log(`4. 名前: ${CLIENT_NAME}`);
  console.log('5. 承認済みのリダイレクト URI:');
  REDIRECT_URIS.forEach(uri => console.log(`   - ${uri}`));
  console.log('6. 「作成」をクリック\n');
  console.log('作成後、以下のコマンドでJSONファイルを作成できます:');
  console.log('   node scripts/create-oauth-json.js\n');
}

// 実際には、Google Cloud Console APIにはOAuth 2.0クライアントIDを直接作成するAPIがないため、
// 代替方法として、既存のクライアントIDを確認するか、ユーザーに手動で作成してもらう必要があります
// しかし、可能な限り自動化するため、以下のアプローチを試みます：

// Google Cloud ConsoleのREST APIを使用してOAuth 2.0クライアントIDを作成
async function createOAuthClientWithREST() {
  console.log('🚀 Google Cloud Console REST APIを使用してOAuth 2.0クライアントIDを作成します\n');

  // サービスアカウントの認証情報を取得
  const keyFile = path.join(__dirname, '..', 'reverberant-kit-475103-q0-3ba90e3e958e.json');
  
  if (!fs.existsSync(keyFile)) {
    console.error('❌ サービスアカウントのJSONキーファイルが見つかりません');
    return false;
  }

  try {
    const key = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    // Google Cloud Console APIのエンドポイント
    // 注意: 実際には、OAuth 2.0クライアントIDを作成する専用のAPIエンドポイントは存在しません
    // IAM Credentials APIや他のAPIを使用する必要がありますが、
    // OAuth 2.0クライアントIDの作成は通常、Web UIを通じて行います

    console.log('⚠️ Google Cloud Console APIにはOAuth 2.0クライアントIDを直接作成するAPIがありません。');
    console.log('そのため、完全自動化は不可能です。\n');
    
    return false;
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return false;
  }
}

async function main() {
  // 既存のJSONファイルがあるか確認
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

  // 完全自動作成を試みる
  await createOAuthClientAutomatically();
  
  // REST APIを試す
  await createOAuthClientWithREST();
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});



