#!/usr/bin/env node

/**
 * GoogleスプレッドシートテンプレートCSV生成スクリプト
 * ヘッダー行とサンプルデータを含むCSVファイルを生成します
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getFutureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function createTemplateCSV() {
  const headers = [
    'id',
    'date',
    'title',
    'summary',
    'detail',
    'steps',
    'service',
    'expiration',
    'conditions',
    'notes',
    'category_main',
    'category_sub',
    'is_public',
    'priority',
    'discount_rate',
    'discount_amount',
    'score',
    'created_at',
    'updated_at'
  ];

  // サンプルデータ
  const sampleData = [
    {
      id: uuidv4(),
      date: getToday(),
      title: 'PayPayボーナス還元キャンペーン',
      summary: 'PayPayで最大20%還元！期間限定のお得なキャンペーンです。',
      detail: '【詳細】\nPayPayで実施中の特別キャンペーンです。\n\n還元率: 20%\n還元額目安: 約5,000円\n\nこの機会をお見逃しなく！',
      steps: '【利用手順】\n1. PayPayアプリを開く\n2. キャンペーンページからエントリー\n3. 対象商品を購入\n4. 還元ポイントが付与されます',
      service: 'PayPay',
      expiration: getFutureDate(30),
      conditions: '新規会員限定 / 先着順 / 1回限り',
      notes: '※還元額は購入金額により変動します\n※キャンペーン期間中に購入した商品が対象です',
      category_main: '決済・ポイント',
      category_sub: 'QR',
      is_public: 'TRUE',
      priority: 'A',
      discount_rate: 20,
      discount_amount: 5000,
      score: 85,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      date: getToday(),
      title: 'Amazonポイント還元セール',
      summary: 'Amazonでポイント最大5%還元！期間限定セール開催中です。',
      detail: '【詳細】\nAmazonで実施中のポイント還元セールです。\n\n還元率: 最大5%\n対象商品: セール対象商品のみ',
      steps: '【利用手順】\n1. Amazonにログイン\n2. セールページを確認\n3. 対象商品を購入\n4. ポイントが還元されます',
      service: 'Amazon',
      expiration: getFutureDate(14),
      conditions: 'Amazonアカウント必須 / 先着順',
      notes: '※還元率は商品により異なります',
      category_main: 'スーパー・量販店・EC',
      category_sub: '',
      is_public: 'TRUE',
      priority: 'B',
      discount_rate: 5,
      discount_amount: 1000,
      score: 70,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      date: getToday(),
      title: 'セブンイレブン ポイント2倍キャンペーン',
      summary: 'セブンイレブンでnanacoポイント2倍！お買い物がお得に。',
      detail: '【詳細】\nセブンイレブンでnanacoポイントが2倍になるキャンペーンです。',
      steps: '【利用手順】\n1. nanacoカードを提示\n2. 対象商品を購入\n3. ポイントが2倍付与されます',
      service: 'セブンイレブン',
      expiration: getFutureDate(7),
      conditions: 'nanacoカード必須',
      notes: '※一部商品は対象外です',
      category_main: 'スーパー・量販店・EC',
      category_sub: '',
      is_public: 'TRUE',
      priority: 'C',
      discount_rate: 2,
      discount_amount: 200,
      score: 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // CSV形式に変換
  const csvRows = [
    headers.map(escapeCSV).join(','),
    ...sampleData.map(row => 
      headers.map(header => escapeCSV(row[header])).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');
  
  const outputPath = path.join(process.cwd(), 'spreadsheet-template.csv');
  fs.writeFileSync(outputPath, csvContent, 'utf-8');
  
  console.log('✅ スプレッドシートテンプレートCSVを作成しました！');
  console.log(`   場所: ${outputPath}\n`);
  console.log('📝 次のステップ:');
  console.log('   1. Googleスプレッドシートを開く');
  console.log('   2. ファイル → インポート → アップロード');
  console.log(`   3. ${outputPath} を選択`);
  console.log('   4. インポート設定で「カンマ区切り」を選択');
  console.log('   5. 「データをインポート」をクリック\n');
  console.log('または、CSVファイルを開いて内容をコピー＆ペーストすることもできます。\n');
}

createTemplateCSV();

