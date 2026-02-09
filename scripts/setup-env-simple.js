#!/usr/bin/env node

/**
 * 環境変数セットアップスクリプト（簡易版）
 * JSONファイルを直接指定して .env.local を作成します
 */

const fs = require('fs');
const path = require('path');

// コマンドライン引数から取得
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('📝 使用方法:');
  console.log('   node scripts/setup-env-simple.js <スプレッドシートID> <JSONファイルパス>');
  console.log('');
  console.log('例:');
  console.log('   node scripts/setup-env-simple.js 1a2b3c4d5e6f7g8h9i0j C:\\Users\\username\\Downloads\\service-account-key.json');
  console.log('');
  console.log('または、対話形式のセットアップ:');
  console.log('   node scripts/setup-env.js');
  process.exit(1);
}

const spreadsheetId = args[0];
const jsonPath = args[1];

// ファイルパスの処理
let fullPath = jsonPath.trim();
fullPath = fullPath.replace(/^["']|["']$/g, ''); // クォートを削除

if (!path.isAbsolute(fullPath)) {
  fullPath = path.resolve(process.cwd(), fullPath);
}

console.log(`📂 JSONファイルを読み込み中: ${fullPath}`);

if (!fs.existsSync(fullPath)) {
  console.error(`❌ ファイルが見つかりません: ${fullPath}`);
  process.exit(1);
}

try {
  const jsonContent = fs.readFileSync(fullPath, 'utf-8');
  const parsed = JSON.parse(jsonContent);
  
  // 必須フィールドの確認
  if (!parsed.type || !parsed.project_id || !parsed.private_key || !parsed.client_email) {
    console.warn('⚠️  警告: JSONファイルに必須フィールドが不足している可能性があります。');
  }
  
  const serviceAccountKey = JSON.stringify(parsed);
  
  // .env.local ファイルを作成
  const envPath = path.join(process.cwd(), '.env.local');
  
  let envContent = `# Google Sheets設定
# 自動生成: ${new Date().toISOString()}

# 必須: スプレッドシートID
GOOGLE_SHEETS_SPREADSHEET_ID=${spreadsheetId.trim()}

# サービスアカウント（プライベートスプレッドシート用）
GOOGLE_SERVICE_ACCOUNT_KEY=${serviceAccountKey}

`;

  fs.writeFileSync(envPath, envContent, 'utf-8');
  
  console.log('\n✅ .env.local ファイルを作成しました！');
  console.log(`   場所: ${envPath}\n`);
  console.log('📝 次のステップ:');
  console.log('   1. Googleスプレッドシートにサービスアカウントのメールアドレスを共有（閲覧権限）');
  console.log(`      メールアドレス: ${parsed.client_email}`);
  console.log('   2. npm run dev でサーバーを起動');
  console.log('   3. http://localhost:3000 で確認\n');
  
} catch (error) {
  console.error(`❌ エラーが発生しました: ${error.message}`);
  process.exit(1);
}

