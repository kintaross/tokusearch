#!/usr/bin/env node

/**
 * 環境変数セットアップスクリプト
 * 対話形式で .env.local ファイルを作成します
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 TokuSearch 環境変数セットアップ\n');
  console.log('このスクリプトは .env.local ファイルを作成します。\n');

  const envPath = path.join(process.cwd(), '.env.local');
  
  // 既存のファイルがあるか確認
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local が既に存在します。上書きしますか？ (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('キャンセルしました。');
      rl.close();
      return;
    }
  }

  console.log('\n📋 スプレッドシートIDを入力してください');
  console.log('   GoogleスプレッドシートのURLから取得できます:');
  console.log('   https://docs.google.com/spreadsheets/d/[ここがID]/edit\n');
  const spreadsheetId = await question('スプレッドシートID: ');

  if (!spreadsheetId || spreadsheetId.trim() === '') {
    console.log('❌ スプレッドシートIDは必須です。');
    rl.close();
    return;
  }

  console.log('\n🔐 認証方法を選択してください:');
  console.log('   1. APIキー（公開スプレッドシート用・簡単）');
  console.log('   2. サービスアカウント（プライベートスプレッドシート用・推奨）');
  const authMethod = await question('選択 (1 or 2): ');

  let apiKey = '';
  let serviceAccountKey = '';

  if (authMethod === '1') {
    console.log('\n📝 APIキーを入力してください');
    console.log('   Google Cloud Consoleで取得: https://console.cloud.google.com/');
    console.log('   1. APIとサービス → ライブラリ → Google Sheets API を有効化');
    console.log('   2. APIとサービス → 認証情報 → APIキーを作成\n');
    apiKey = await question('APIキー: ');
    
    if (!apiKey || apiKey.trim() === '') {
      console.log('❌ APIキーは必須です。');
      rl.close();
      return;
    }
  } else if (authMethod === '2') {
    console.log('\n📝 サービスアカウントJSONキーのパスを入力してください');
    console.log('   ファイルパスを入力するか、Enterで直接入力モードに切り替えます');
    console.log('   例: C:\\Users\\username\\Downloads\\service-account-key.json');
    console.log('   または: ..\\Downloads\\service-account-key.json\n');
    const jsonPath = await question('JSONファイルのパス（または Enter で直接入力）: ');
    
    if (jsonPath && jsonPath.trim() !== '') {
      // ファイルパスが指定された場合
      let fullPath = jsonPath.trim();
      
      // クォートを削除（ドラッグ&ドロップで追加される可能性がある）
      fullPath = fullPath.replace(/^["']|["']$/g, '');
      
      // 相対パスの場合
      if (!path.isAbsolute(fullPath)) {
        fullPath = path.resolve(process.cwd(), fullPath);
      }
      
      console.log(`\n📂 ファイルパスを確認中: ${fullPath}`);
      
      if (fs.existsSync(fullPath)) {
        try {
          const jsonContent = fs.readFileSync(fullPath, 'utf-8');
          // JSONの検証
          const parsed = JSON.parse(jsonContent);
          
          // 必須フィールドの確認
          if (!parsed.type || !parsed.project_id || !parsed.private_key || !parsed.client_email) {
            console.log('⚠️  警告: JSONファイルに必須フィールドが不足している可能性があります。');
            const continueAnyway = await question('続行しますか？ (y/N): ');
            if (continueAnyway.toLowerCase() !== 'y') {
              console.log('キャンセルしました。');
              rl.close();
              return;
            }
          }
          
          serviceAccountKey = JSON.stringify(parsed);
          console.log('✅ JSONファイルを読み込みました。');
        } catch (error) {
          console.log(`❌ JSONファイルの読み込みに失敗しました: ${error.message}`);
          rl.close();
          return;
        }
      } else {
        console.log(`❌ ファイルが見つかりません: ${fullPath}`);
        console.log('   ファイルパスを確認してください。');
        rl.close();
        return;
      }
    } else {
      // 直接入力の場合
      console.log('\n📝 JSONファイルの内容を貼り付けてください（空行で終了）:');
      console.log('   （複数行のJSONをそのまま貼り付け可能です）\n');
      const lines = [];
      let emptyLineCount = 0;
      while (true) {
        const line = await question('');
        if (line.trim() === '') {
          emptyLineCount++;
          if (emptyLineCount >= 2) break; // 2回連続で空行なら終了
        } else {
          emptyLineCount = 0;
          lines.push(line);
        }
      }
      try {
        const jsonContent = lines.join('\n');
        const parsed = JSON.parse(jsonContent);
        serviceAccountKey = JSON.stringify(parsed);
        console.log('✅ JSONの形式を確認しました。');
      } catch (error) {
        console.log(`❌ JSONの形式が正しくありません: ${error.message}`);
        console.log('   ファイルパスを指定する方法をお試しください。');
        rl.close();
        return;
      }
    }
  } else {
    console.log('❌ 無効な選択です。');
    rl.close();
    return;
  }

  // オプション設定
  console.log('\n📝 オプション設定（Enterでスキップ）');
  const sheetName = await question('シート名（デフォルト: Sheet1）: ');
  console.log('\n💡 ベースURLについて:');
  console.log('   本番環境でサイトを公開する際のURLです（例: https://yourdomain.com）');
  console.log('   開発環境では不要です。Enterでスキップできます。\n');
  const baseUrl = await question('ベースURL（本番環境用・スキップ可）: ');

  // .env.local ファイルを作成
  let envContent = `# Google Sheets設定
# 自動生成: ${new Date().toISOString()}

# 必須: スプレッドシートID
GOOGLE_SHEETS_SPREADSHEET_ID=${spreadsheetId.trim()}

`;

  if (apiKey) {
    envContent += `# APIキー（公開スプレッドシート用）
GOOGLE_SHEETS_API_KEY=${apiKey.trim()}

`;
  }

  if (serviceAccountKey) {
    envContent += `# サービスアカウント（プライベートスプレッドシート用）
GOOGLE_SERVICE_ACCOUNT_KEY=${serviceAccountKey}

`;
  }

  if (sheetName && sheetName.trim() !== '') {
    envContent += `# カスタムシート名
GOOGLE_SHEETS_SHEET_NAME=${sheetName.trim()}

`;
  }

  if (baseUrl && baseUrl.trim() !== '') {
    envContent += `# ベースURL（本番環境用）
NEXT_PUBLIC_BASE_URL=${baseUrl.trim()}

`;
  }

  fs.writeFileSync(envPath, envContent, 'utf-8');
  
  console.log('\n✅ .env.local ファイルを作成しました！');
  console.log(`   場所: ${envPath}\n`);
  console.log('📝 次のステップ:');
  console.log('   1. Googleスプレッドシートにヘッダー行を設定');
  console.log('   2. スプレッドシートにサンプルデータを追加');
  console.log('   3. npm run dev でサーバーを起動');
  console.log('   4. http://localhost:3000 で確認\n');
  console.log('詳細は docs/SETUP_SPREADSHEET.md を参照してください。\n');

  rl.close();
}

main().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  rl.close();
  process.exit(1);
});

