#!/usr/bin/env node

/**
 * Google Drive Owner Email環境変数をVercelに設定するスクリプト
 * 
 * 使用方法:
 *   node scripts/setup-drive-owner.js <email>
 * 
 * 例:
 *   node scripts/setup-drive-owner.js tokusearch@gmail.com
 */

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
  console.log('🚀 Google Drive Owner Email 環境変数セットアップ\n');

  // コマンドライン引数からメールアドレスを取得
  let email = process.argv[2];

  // 引数がない場合は対話的に聞く
  if (!email) {
    console.log('Google Driveの所有権を持つユーザーのメールアドレスを入力してください。');
    console.log('例: tokusearch@gmail.com\n');
    email = await question('メールアドレス: ');
  }

  if (!email || email.trim() === '') {
    console.log('❌ メールアドレスは必須です。');
    rl.close();
    process.exit(1);
  }

  email = email.trim();

  // メールアドレスの形式チェック（簡易版）
  if (!email.includes('@')) {
    console.log('❌ 有効なメールアドレスを入力してください。');
    rl.close();
    process.exit(1);
  }

  console.log(`\n📧 設定するメールアドレス: ${email}`);
  console.log('環境: Production, Preview, Development\n');

  const confirm = await question('この設定でVercelに環境変数を追加しますか？ (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('キャンセルしました。');
    rl.close();
    return;
  }

  try {
    console.log('\n⏳ Vercelに環境変数を追加中...\n');

    // Production環境
    console.log('📦 Production環境に追加中...');
    execSync(`echo ${email} | vercel env add GOOGLE_DRIVE_OWNER_EMAIL production`, {
      stdio: 'inherit',
      shell: true,
    });

    // Preview環境
    console.log('\n📦 Preview環境に追加中...');
    execSync(`echo ${email} | vercel env add GOOGLE_DRIVE_OWNER_EMAIL preview`, {
      stdio: 'inherit',
      shell: true,
    });

    // Development環境
    console.log('\n📦 Development環境に追加中...');
    execSync(`echo ${email} | vercel env add GOOGLE_DRIVE_OWNER_EMAIL development`, {
      stdio: 'inherit',
      shell: true,
    });

    console.log('\n✅ 環境変数の追加が完了しました！');
    console.log('\n📝 次のステップ:');
    console.log('   1. Vercelで再デプロイを実行してください');
    console.log('   2. または、以下のコマンドで再デプロイ:');
    console.log('      vercel --prod --yes\n');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    console.log('\n💡 手動で設定する場合:');
    console.log('   vercel env add GOOGLE_DRIVE_OWNER_EMAIL production');
    console.log('   （プロンプトでメールアドレスを入力）\n');
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



