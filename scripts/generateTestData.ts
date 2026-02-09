import { Deal, CategoryMain } from '@/types/deal';

function generateId(): string {
  return `deal-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

const categories: CategoryMain[] = [
  'ドラッグストア・日用品',
  'スーパー・量販店・EC',
  'グルメ・外食',
  '旅行・交通',
  '決済・ポイント',
  'タバコ・嗜好品',
  'その他',
];

const services = [
  'Amazon', '楽天市場', 'Yahooショッピング', 'PayPay', 'LINE Pay', 'd払い',
  'セブンイレブン', 'ファミリーマート', 'ローソン', 'イオン', 'イトーヨーカドー',
  'マツキヨ', 'サンドラッグ', 'ツルハドラッグ', 'ウエルシア', 'ココカラファイン',
  'スターバックス', 'マクドナルド', 'すき家', '松屋', '吉野家',
  'JR東日本', 'JR西日本', 'ANA', 'JAL', '楽天トラベル',
];

const titles = [
  'PayPayボーナス還元キャンペーン',
  'Amazonポイント還元セール',
  '楽天スーパーセール開催中',
  'LINE Pay キャッシュバック',
  'd払い 最大20%還元',
  'セブンイレブン ポイント2倍',
  'マツキヨ 薬剤師の日セール',
  'スターバックス ドリンク半額',
  'マクドナルド ハッピーセット特典',
  'すき家 牛丼セット割引',
  'JR東日本 新幹線割引',
  'ANA マイル2倍キャンペーン',
  '楽天トラベル 宿泊割引',
  'イオン お買い物マラソン',
  'ファミリーマート おにぎりセール',
];

function getRandomDate(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function getRandomExpiration(): string {
  const days = Math.floor(Math.random() * 30) + 1;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateDeal(index: number): Deal {
  const category = getRandomElement(categories);
  const service = getRandomElement(services);
  const title = `${service} ${getRandomElement(titles)}`;
  const priority = getRandomElement(['A', 'B', 'C'] as const);
  const discountRate = Math.floor(Math.random() * 50) + 5;
  const discountAmount = Math.floor(Math.random() * 5000) + 500;
  const score = Math.floor(Math.random() * 100);
  const daysAgo = Math.floor(Math.random() * 30);

  return {
    id: generateId(),
    date: getRandomDate(daysAgo),
    title,
    summary: `${service}で${discountRate}%還元！期間限定のお得なキャンペーンです。${discountAmount}円相当の還元が期待できます。`,
    detail: `【詳細】\n${service}で実施中の特別キャンペーンです。\n\n還元率: ${discountRate}%\n還元額目安: 約${discountAmount.toLocaleString()}円\n\nこの機会をお見逃しなく！`,
    steps: `【利用手順】\n1. ${service}のアプリを開く\n2. キャンペーンページからエントリー\n3. 対象商品を購入\n4. 還元ポイントが付与されます`,
    service,
    expiration: getRandomExpiration(),
    conditions: '新規会員限定 / 先着順 / 1回限り',
    notes: '※還元額は購入金額により変動します\n※キャンペーン期間中に購入した商品が対象です',
    category_main: category,
    category_sub: category === '決済・ポイント' ? getRandomElement(['クレカ', 'QR', 'コード払い']) : undefined,
    is_public: true,
    priority,
    discount_rate: discountRate,
    discount_amount: discountAmount,
    score,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function generateTestData(count: number = 100): Deal[] {
  return Array.from({ length: count }, (_, i) => generateDeal(i));
}

// CSV形式で出力する関数
export function dealsToCSV(deals: Deal[]): string {
  const headers = [
    'id', 'date', 'title', 'summary', 'detail', 'steps', 'service',
    'expiration', 'conditions', 'notes', 'category_main', 'category_sub',
    'is_public', 'priority', 'discount_rate', 'discount_amount', 'score',
    'created_at', 'updated_at'
  ];

  const rows = deals.map(deal => [
    deal.id,
    deal.date,
    deal.title,
    deal.summary,
    deal.detail,
    deal.steps,
    deal.service,
    deal.expiration,
    deal.conditions,
    deal.notes,
    deal.category_main,
    deal.category_sub || '',
    deal.is_public ? 'TRUE' : 'FALSE',
    deal.priority,
    deal.discount_rate?.toString() || '',
    deal.discount_amount?.toString() || '',
    deal.score.toString(),
    deal.created_at,
    deal.updated_at,
  ]);

  const csvRows = [headers, ...rows].map(row =>
    row.map(cell => {
      const str = String(cell || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );

  return csvRows.join('\n');
}

