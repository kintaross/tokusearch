/**
 * 既存データマイグレーションスクリプト
 * 
 * 目的: スプレッドシートの既存27件のデータに対して、
 *       LLMで新しいカラム（difficulty, area_type等）を自動生成して更新する
 * 
 * 実行方法:
 * node scripts/migrate-existing-data.js [--test] [--batch-size=3]
 * 
 * オプション:
 * --test: テストモード（最初の3件のみ処理）
 * --batch-size=N: バッチサイズ（デフォルト: 3）
 */

// dotenvで.env.localを読み込む
require('dotenv').config({ path: '.env.local' });

const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// 環境変数チェック
if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY が設定されていません');
  process.exit(1);
}

if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
  console.error('❌ GOOGLE_SHEETS_SPREADSHEET_ID が設定されていません');
  process.exit(1);
}

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  console.error('❌ GOOGLE_GEMINI_API_KEY が設定されていません');
  process.exit(1);
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEETS_SHEET_NAME || 'database';

// コマンドライン引数の解析
const args = process.argv.slice(2);
const isTestMode = args.includes('--test');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const BATCH_SIZE = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 3;
const MAX_RETRIES = 3;
const RETRY_DELAY = 20000; // 20秒（API制限解除待ち）

// 進捗保存ファイル
const PROGRESS_FILE = path.join(__dirname, '.migration-progress.json');

// Google Sheets認証
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Gemini AI初期化
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

/**
 * 進捗を保存
 */
function saveProgress(processedIds) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ processedIds, timestamp: new Date().toISOString() }, null, 2));
}

/**
 * 進捗を読み込み
 */
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    return data.processedIds || [];
  }
  return [];
}

/**
 * 進捗をクリア
 */
function clearProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }
}

/**
 * 待機（リトライ用）
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * リトライ機能付き非同期関数実行
 */
async function retryAsync(fn, fnName, maxRetries = MAX_RETRIES) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isLastAttempt = i === maxRetries - 1;
      
      if (isLastAttempt) {
        console.error(`❌ ${fnName}: ${maxRetries}回のリトライ後も失敗`);
        throw error;
      }
      
      console.warn(`⚠️ ${fnName}: エラー発生、${i + 1}回目のリトライ (${RETRY_DELAY}ms後)`);
      console.warn(`   エラー内容: ${error.message}`);
      await sleep(RETRY_DELAY * (i + 1)); // 徐々に待機時間を増やす
    }
  }
  throw lastError;
}

/**
 * スプレッドシートから全データを取得
 */
async function fetchAllData() {
  console.log('📊 スプレッドシートからデータ取得中...');
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_NAME,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error('データが見つかりません');
  }

  // ヘッダー行
  const headers = rows[0];
  console.log(`📋 ヘッダー: ${headers.join(', ')}`);
  
  // ヘッダーのインデックスマップ
  const headerMap = {};
  headers.forEach((header, index) => {
    if (header && typeof header === 'string') {
      headerMap[header.toLowerCase().trim()] = index;
    }
  });

  // データ行を配列に変換
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // is_publicがTRUEのもののみ処理
    const isPublic = row[headerMap['is_public']]?.toString().toUpperCase() === 'TRUE';
    if (!isPublic) {
      console.log(`⚠️ 行 ${i+1}: is_public=FALSEのためスキップ`);
      continue;
    }

    const item = {
      rowIndex: i + 1, // スプレッドシートの行番号（1-based、ヘッダー含む）
      id: row[headerMap['id']] || '',
      title: row[headerMap['title']] || '',
      summary: row[headerMap['summary']] || '',
      detail: row[headerMap['detail']] || '',
      steps: row[headerMap['steps']] || '',
      service: row[headerMap['service']] || '',
      conditions: row[headerMap['conditions']] || '',
      category_main: row[headerMap['category_main']] || '',
      // 既存の新カラムの値を確認
      existing_difficulty: row[headerMap['difficulty']] || null,
      existing_area_type: row[headerMap['area_type']] || null,
      existing_target_user_type: row[headerMap['target_user_type']] || null,
      existing_usage_type: row[headerMap['usage_type']] || null,
      existing_is_welkatsu: row[headerMap['is_welkatsu']] || null,
      existing_tags: row[headerMap['tags']] || null,
    };

    data.push(item);
  }

  console.log(`✅ データ取得完了: ${data.length}件`);
  return { data, headerMap, headers };
}

/**
 * LLMでタグ付け（バッチ処理対応）
 */
async function tagDataWithLLM(items) {
  console.log(`🤖 LLMでタグ付け中... (${items.length}件)`);

  // 簡略化データ（コスト削減）
  const simplifiedItems = items.map((item, index) => ({
    index: index,
    id: item.id,
    title: item.title,
    summary: item.summary,
    detail: item.detail.substring(0, 300), // 最初の300文字のみ
    steps: item.steps,
    service: item.service,
    conditions: item.conditions,
    category_main: item.category_main,
  }));

  const prompt = `
以下のお得情報に対して、各案件ごとに以下の情報を判定してください。

# 判定項目

1. difficulty: 案件の難易度
   - low: エントリー＋支払い程度（会員登録が1サービス内で完結）
   - medium: 条件が2〜3個ある、2サービス連携など
   - high: 銀行口座・証券口座・クレカ・保険などの新規開設が必要

2. area_type: 利用チャネル
   - online: 申込〜利用がオンライン完結
   - store: 実店舗での購入・利用がメイン
   - online+store: 決済手段・ポイントなど、どちらでも利用可能

3. target_user_type: 対象ユーザー種別
   - all: 誰でも利用可能
   - new_or_inactive: 新規・休眠ユーザー限定（「初めて」「新規」「利用なし」「久しぶり」等）
   - limited: 特定プラン・家族・学生など限定

4. usage_type: 主な用途
   - daily_goods: ドラッグストア・日用品・日常消費
   - eating_out: グルメ・外食
   - travel: 旅行・交通・レジャー
   - financial: 銀行・証券・投資・クレカ・決済系
   - utility_bills: 公共料金・通信費・税金
   - hobby: ゲーム・サブスク・エンタメ
   - other: その他

5. is_welkatsu: ウエル活関連かどうか（boolean）
   - serviceが「ウエルシア」を含む、または本文に「ウエルシア」「ウエル活」が含まれる場合はtrue
   - それ以外はfalse

6. tags: 検索・関連表示用のタグ（3〜7個の配列）
   - セール名、サービス名、決済名、汎用ワードを含む
   - 類義語は統一する

# 入力データ

${JSON.stringify(simplifiedItems, null, 2)}

# 出力形式

必ず以下のJSON配列形式で返してください。コードブロック記法は不要です。

[
  {
    "index": 0,
    "difficulty": "low",
    "area_type": "online",
    "target_user_type": "all",
    "usage_type": "daily_goods",
    "is_welkatsu": false,
    "tags": ["タグ1", "タグ2", "タグ3"]
  }
]

⚠️ 重要:
- 純粋なJSON配列のみを返す（説明文は不要）
- どのフィールドもnull・空文字・"unknown"を返さない
- 迷った場合は最も近いものを選ぶ
- indexは入力データと同じ順序で返す
`.trim();

  // リトライ機能付きでLLM呼び出し
  const taggingResults = await retryAsync(async () => {
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  console.log('📝 LLM応答を受信');
  
  // コードブロック記号を除去
  const jsonString = responseText
    .replace(/^```json\s*/m, '')
    .replace(/```$/m, '')
    .trim();

    let parsed;
  try {
      parsed = JSON.parse(jsonString);
  } catch (e) {
    console.error('❌ JSONパースエラー:', e.message);
      console.error('LLM応答の一部:', jsonString.substring(0, 500));
      throw new Error(`JSONパース失敗: ${e.message}`);
  }

    if (!Array.isArray(parsed)) {
    throw new Error('LLMの出力が配列ではありません');
  }

    return parsed;
  }, 'LLMタグ付け');

  console.log(`✅ タグ付け完了: ${taggingResults.length}件`);
  
  // 結果を元のデータと結合
  const enrichedItems = items.map((item, index) => {
    const tagging = taggingResults.find(t => t.index === index);
    
    if (!tagging) {
      console.warn(`⚠️ インデックス${index}のタグ情報が見つかりません`);
      return {
        ...item,
        difficulty: 'medium',
        area_type: 'online+store',
        target_user_type: 'all',
        usage_type: 'other',
        is_welkatsu: 'FALSE',
        tags: '',
      };
    }
    
    // タグ配列を文字列に変換
    const tagsString = Array.isArray(tagging.tags) 
      ? tagging.tags.join(',') 
      : '';
    
    return {
      ...item,
      difficulty: tagging.difficulty,
      area_type: tagging.area_type,
      target_user_type: tagging.target_user_type,
      usage_type: tagging.usage_type,
      is_welkatsu: tagging.is_welkatsu ? 'TRUE' : 'FALSE',
      tags: tagsString,
    };
  });

  return enrichedItems;
}

/**
 * スプレッドシートを更新（バッチ処理・リトライ対応）
 */
async function updateSpreadsheet(enrichedItems, headerMap, headers) {
  console.log(`📝 スプレッドシートを更新中... (${enrichedItems.length}件)`);

  // 新カラムのインデックスを確認（なければ追加）
  const requiredColumns = ['difficulty', 'area_type', 'target_user_type', 'usage_type', 'is_welkatsu', 'tags'];
  const missingColumns = requiredColumns.filter(col => !headerMap[col]);
  
  if (missingColumns.length > 0) {
    console.log(`⚠️ 以下のカラムがありません: ${missingColumns.join(', ')}`);
    console.log('📌 ヘッダー行に追加します...');
    
    // ヘッダー行を更新（リトライ付き）
    await retryAsync(async () => {
    const newHeaders = [...headers, ...missingColumns];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!1:1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [newHeaders],
      },
    });
    }, 'ヘッダー行更新');
    
    // headerMapを更新
    missingColumns.forEach((col, idx) => {
      headerMap[col] = headers.length + idx;
    });
    
    console.log('✅ ヘッダー行を更新しました');
  }

  // 各行を順次更新（並列処理ではなく順次処理でAPI制限を回避）
  for (const item of enrichedItems) {
    await retryAsync(async () => {
    const rowIndex = item.rowIndex;
      
      // カラムインデックスをアルファベットに変換（26列以上に対応）
      const getColumnLetter = (index) => {
        let letter = '';
        while (index >= 0) {
          letter = String.fromCharCode(65 + (index % 26)) + letter;
          index = Math.floor(index / 26) - 1;
        }
        return letter;
      };

      const colDifficulty = getColumnLetter(headerMap['difficulty']);
      const colAreaType = getColumnLetter(headerMap['area_type']);
      const colTargetUserType = getColumnLetter(headerMap['target_user_type']);
      const colUsageType = getColumnLetter(headerMap['usage_type']);
      const colIsWelkatsu = getColumnLetter(headerMap['is_welkatsu']);
      const colTags = getColumnLetter(headerMap['tags']);

    // 範囲を指定して更新
    const range = `${SHEET_NAME}!${colDifficulty}${rowIndex}:${colTags}${rowIndex}`;
    const values = [[
      item.difficulty,
      item.area_type,
      item.target_user_type,
      item.usage_type,
      item.is_welkatsu,
      item.tags,
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
    }, `行${item.rowIndex}更新`);

    console.log(`  ✅ 行 ${item.rowIndex} を更新: ${item.title.substring(0, 30)}...`);
  }

  console.log(`✅ 全${enrichedItems.length}件の更新完了`);
}

/**
 * メイン処理（バッチ処理・進捗保存対応）
 */
async function main() {
  try {
    console.log('🚀 既存データマイグレーション開始');
    if (isTestMode) {
      console.log('🧪 テストモード: 最初の3件のみ処理します\n');
    } else {
      console.log(`📦 バッチサイズ: ${BATCH_SIZE}件ずつ処理します\n`);
    }

    // 1. データ取得
    const { data, headerMap, headers } = await fetchAllData();
    
    if (data.length === 0) {
      console.log('✅ 処理対象のデータがありません');
      return;
    }

    // 2. 進捗読み込み
    const processedIds = loadProgress();
    console.log(`📂 進捗読み込み: ${processedIds.length}件が処理済み\n`);

    // 3. 未処理のデータをフィルタ
    let targetData = data.filter(item => !processedIds.includes(item.id));
    
    // テストモードの場合は最初の3件のみ
    if (isTestMode) {
      targetData = targetData.slice(0, 3);
    }

    if (targetData.length === 0) {
      console.log('✅ すべてのデータが処理済みです');
      clearProgress();
      return;
    }

    console.log(`📋 処理対象: ${targetData.length}件\n`);

    // 4. バッチ処理
    const allEnrichedItems = [];
    for (let i = 0; i < targetData.length; i += BATCH_SIZE) {
      const batch = targetData.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(targetData.length / BATCH_SIZE);

      console.log(`\n🔄 バッチ ${batchNum}/${totalBatches} (${batch.length}件) を処理中...`);
      console.log(`   対象: ${batch.map(b => b.title.substring(0, 20) + '...').join(', ')}`);

      try {
        // LLMでタグ付け
        const enrichedBatch = await tagDataWithLLM(batch);

        // スプレッドシート更新
        await updateSpreadsheet(enrichedBatch, headerMap, headers);

        // 進捗保存
        const batchIds = batch.map(item => item.id);
        processedIds.push(...batchIds);
        saveProgress(processedIds);

        allEnrichedItems.push(...enrichedBatch);

        console.log(`✅ バッチ ${batchNum}/${totalBatches} 完了`);

        // 次のバッチまで少し待機（API制限対策）
        if (i + BATCH_SIZE < targetData.length) {
          console.log('   ⏳ 次のバッチまで2秒待機...');
          await sleep(2000);
        }

      } catch (error) {
        console.error(`\n❌ バッチ ${batchNum} でエラーが発生しました:`, error.message);
        console.error('   進捗は保存されています。再実行してください。');
        throw error;
      }
    }

    // 5. 進捗クリア
    clearProgress();

    console.log('\n✅ マイグレーション完了！');
    
    // 結果サマリー
    console.log('\n📊 処理結果サマリー:');
    console.log(`  - 処理件数: ${allEnrichedItems.length}件`);
    console.log(`  - 難易度 (low): ${allEnrichedItems.filter(i => i.difficulty === 'low').length}件`);
    console.log(`  - 難易度 (medium): ${allEnrichedItems.filter(i => i.difficulty === 'medium').length}件`);
    console.log(`  - 難易度 (high): ${allEnrichedItems.filter(i => i.difficulty === 'high').length}件`);
    console.log(`  - ウエル活: ${allEnrichedItems.filter(i => i.is_welkatsu === 'TRUE').length}件`);

    console.log('\n💡 次のステップ:');
    console.log('  1. スプレッドシートで新カラムが正しく追加されているか確認');
    console.log('  2. アプリケーションを再デプロイまたはリロード');
    console.log('  3. ウエル活ページ、ピックアップページで表示を確認');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    if (error.stack) {
      console.error('\nスタックトレース:');
    console.error(error.stack);
    }
    console.error('\n💡 トラブルシューティング:');
    console.error('  - 進捗ファイルが残っている場合、再実行すると途中から再開できます');
    console.error('  - 完全にやり直す場合は .migration-progress.json を削除してください');
    process.exitCode = 1;
  } finally {
    // 適切なクリーンアップ
    console.log('\n🔚 処理を終了します...');
    // 少し待機してからプロセス終了（非同期処理のクリーンアップ）
    await sleep(500);
  }
}

// 実行
main().then(() => {
  // 正常終了
  process.exit(process.exitCode || 0);
}).catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});

