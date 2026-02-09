import { google } from 'googleapis';
import { Deal, CategoryMain } from '@/types/deal';
import { getDbPool } from '@/lib/db';
import { fetchDealsFromDb, updateDealInDb } from '@/lib/db-deals-read';

function useDealsDb(): boolean {
  const mode = (process.env.DEALS_DATA_SOURCE || '').toLowerCase();
  return mode === 'db' || process.env.DEALS_USE_DB === 'true';
}

// Google Sheets クライアントを取得するヘルパー関数
async function getGoogleSheetsClient(readOnly: boolean = true) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!spreadsheetId || !serviceAccountKey) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID と GOOGLE_SERVICE_ACCOUNT_KEY が必要です');
  }

  const scopes = readOnly
    ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
    : ['https://www.googleapis.com/auth/spreadsheets'];

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(serviceAccountKey),
    scopes,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';

  return { sheets, spreadsheetId, sheetName };
}

// 開発環境用のモックデータ生成
function generateMockData(): Deal[] {
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

  function generateId(): string {
    return `mock-${Math.random().toString(36).substring(2, 15)}`;
  }

  const deals: Deal[] = [];
  for (let i = 0; i < 100; i++) {
    const category = getRandomElement(categories);
    const service = getRandomElement(services);
    const title = `${service} ${getRandomElement(titles)}`;
    const priority = getRandomElement(['A', 'B', 'C'] as const);
    const discountRate = Math.floor(Math.random() * 50) + 5;
    const discountAmount = Math.floor(Math.random() * 5000) + 500;
    const score = Math.floor(Math.random() * 100);
    const daysAgo = Math.floor(Math.random() * 30);

    // created_atは時刻も含めてランダムに設定（過去30日以内）
    const hoursAgo = Math.floor(Math.random() * 720); // 0-30日前（時間単位）
    const createdAtDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    deals.push({
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
      created_at: createdAtDate.toISOString(),
      updated_at: createdAtDate.toISOString(),
    });
  }

  return deals;
}

// スプレッドシートからデータを取得
export async function fetchDealsFromSheet(opts?: { includePrivate?: boolean }): Promise<Deal[]> {
  const includePrivate = opts?.includePrivate === true;

  // DBが正になった後は、既存の呼び出し箇所を壊さないためこの関数を“データソース切替”として使う
  if (useDealsDb()) {
    const pool = getDbPool();
    return await fetchDealsFromDb(pool, { includePrivate });
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  // 開発環境で環境変数が設定されていない場合はモックデータを返す
  if (!spreadsheetId || (!apiKey && !serviceAccountKey)) {
    console.warn('⚠️ 環境変数が設定されていません。モックデータを使用します。');
    return generateMockData();
  }

  try {
    let sheets;
    
    // サービスアカウントキーが設定されている場合はそれを使用（推奨）
    if (serviceAccountKey) {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(serviceAccountKey),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      sheets = google.sheets({ version: 'v4', auth });
    } 
    // APIキーが設定されている場合はそれを使用（公開スプレッドシート用）
    else if (apiKey) {
      sheets = google.sheets({
        version: 'v4',
        auth: apiKey,
      });
    } else {
      throw new Error('GOOGLE_SHEETS_API_KEY または GOOGLE_SERVICE_ACCOUNT_KEY のいずれかが必要です');
    }

    // スプレッドシートの全データを取得
    const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const rows = response.data.values;
    console.log(`📊 データ取得成功: ${rows?.length ?? 0}行`);

    if (!rows || rows.length === 0) {
      return [];
    }

    // ヘッダー行を取得
    const headers = rows[0] as string[];
    console.log('📋 ヘッダー:', headers);
    
    // ヘッダーのインデックスをマッピング
    const headerMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        headerMap[header.toLowerCase().trim()] = index;
      }
    });
    
    console.log('📋 ヘッダーマップ:', JSON.stringify(headerMap));

    // データ行をDealオブジェクトに変換
    const deals: Deal[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // is_publicフィルタ（public用途のみ）
      if (!includePrivate) {
        const isPublicIndex = headerMap['is_public'];
        const isPublicValue = isPublicIndex !== undefined ? row[isPublicIndex] : undefined;

        if (isPublicIndex !== undefined && isPublicValue?.toString().toUpperCase() !== 'TRUE') {
          continue;
        }
      }

      // IDとタイトルの確認
      const idIndex = headerMap['id'];
      const titleIndex = headerMap['title'];
      const id = row[idIndex];
      const title = row[titleIndex];

      if (!id || !title) {
        console.log(`⚠️ 行 ${i+1} スキップ: 必須項目(id, title)が不足しています (id: ${id}, title: ${title})`);
        continue;
      }

      const deal: Deal = {
        id: id || '',
        date: row[headerMap['date']] || '',
        title: title || '',
        summary: row[headerMap['summary']] || '',
        detail: row[headerMap['detail']] || '',
        steps: row[headerMap['steps']] || '',
        service: row[headerMap['service']] || '',
        expiration: row[headerMap['expiration']] || '',
        conditions: row[headerMap['conditions']] || '',
        notes: row[headerMap['notes']] || '',
        category_main: (row[headerMap['category_main']] || 'その他') as CategoryMain,
        category_sub: row[headerMap['category_sub']] || undefined,
        is_public: row[headerMap['is_public']]?.toString().toUpperCase() === 'TRUE',
        priority: (row[headerMap['priority']] || 'C') as 'A' | 'B' | 'C',
        discount_rate: row[headerMap['discount_rate']] ? parseFloat(row[headerMap['discount_rate']]) : undefined,
        discount_amount: row[headerMap['discount_amount']] ? parseFloat(row[headerMap['discount_amount']]) : undefined,
        score: row[headerMap['score']] ? parseFloat(row[headerMap['score']]) : 0,
        created_at: row[headerMap['created_at']] || '',
        updated_at: row[headerMap['updated_at']] || '',
        // 新規追加カラム（フェーズ2改修）
        difficulty: row[headerMap['difficulty']] as any || undefined,
        area_type: row[headerMap['area_type']] as any || undefined,
        target_user_type: row[headerMap['target_user_type']] as any || undefined,
        usage_type: row[headerMap['usage_type']] as any || undefined,
        is_welkatsu: row[headerMap['is_welkatsu']]?.toString().toUpperCase() === 'TRUE' || undefined,
        tags: row[headerMap['tags']] || undefined,
      };

      deals.push(deal);
    }

    console.log(`✅ 有効なデータ件数: ${deals.length}件`);
    return deals;
  } catch (error) {
    console.error('Google Sheetsからのデータ取得エラー:', error);
    // より詳細なエラーメッセージを提供
    if (error instanceof Error) {
      const errorMessage = error.message;
      // よくあるエラーパターンをチェック
      if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
        throw new Error('スプレッドシートへのアクセス権限がありません。サービスアカウント（tokusearch@reverberant-kit-475103-q0.iam.gserviceaccount.com）をスプレッドシートに共有してください。');
      }
      if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('404')) {
        throw new Error('スプレッドシートまたはシートが見つかりません。シート名を確認してください。');
      }
      if (errorMessage.includes('INVALID_ARGUMENT')) {
        throw new Error('スプレッドシートIDまたはシート名が正しくありません。');
      }
    }
    throw error;
  }
}

// フィルタリングとソート
export function filterAndSortDeals(
  deals: Deal[],
  filters: {
    period?: 'today' | '3days' | '7days' | '30days';
    category?: CategoryMain;
    search?: string;
  },
  sortOption: 'default' | 'newest' | 'expiring' | 'discount_rate' | 'discount_amount' | 'score' = 'default'
): Deal[] {
  let filtered = [...deals];
  
  // デフォルト表示：直近10日以内のデータのみ
  if (!filters.period && !filters.category && !filters.search && sortOption === 'default') {
    const now = new Date();
    filtered = filtered.filter(deal => {
      if (!deal.created_at) return false;
      const createdDate = new Date(deal.created_at);
      const diffTime = now.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 10 && diffTime >= 0;
    });
  }

  // 期間フィルタ（投稿日時 = created_at）
  if (filters.period) {
    const now = new Date();
    
    filtered = filtered.filter(deal => {
      if (!deal.created_at) return false;
      const createdDate = new Date(deal.created_at);
      const diffTime = now.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      
      switch (filters.period) {
        case 'today':
          // 24時間以内
          return diffHours <= 24 && diffTime >= 0;
        case '3days':
          return diffDays <= 3 && diffTime >= 0;
        case '7days':
          return diffDays <= 7 && diffTime >= 0;
        case '30days':
          return diffDays <= 30 && diffTime >= 0;
        default:
          return true;
      }
    });
  }

  // カテゴリフィルタ
  if (filters.category) {
    filtered = filtered.filter(deal => deal.category_main === filters.category);
  }

  // 検索フィルタ
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(deal => {
      return (
        deal.title.toLowerCase().includes(searchLower) ||
        deal.summary.toLowerCase().includes(searchLower) ||
        deal.detail.toLowerCase().includes(searchLower) ||
        deal.service.toLowerCase().includes(searchLower) ||
        deal.notes.toLowerCase().includes(searchLower)
      );
    });
  }

  // ソート
  switch (sortOption) {
    case 'newest':
      filtered.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      break;
    case 'expiring':
      filtered.sort((a, b) => {
        const expA = parseExpirationDate(a.expiration);
        const expB = parseExpirationDate(b.expiration);
        if (expA && expB) {
          return expA.getTime() - expB.getTime();
        }
        return 0;
      });
      break;
    case 'discount_rate':
      filtered.sort((a, b) => {
        const rateA = a.discount_rate || 0;
        const rateB = b.discount_rate || 0;
        return rateB - rateA;
      });
      break;
    case 'discount_amount':
      filtered.sort((a, b) => {
        const amountA = a.discount_amount || 0;
        const amountB = b.discount_amount || 0;
        return amountB - amountA;
      });
      break;
    case 'score':
      filtered.sort((a, b) => {
        return b.score - a.score;
      });
      break;
    case 'default':
    default:
      filtered.sort((a, b) => {
        const expA = parseExpirationDate(a.expiration);
        const expB = parseExpirationDate(b.expiration);
        if (expA && expB) {
          const expDiff = expA.getTime() - expB.getTime();
          if (expDiff !== 0) return expDiff;
        }

        const priorityOrder = { A: 1, B: 2, C: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      break;
  }

  return filtered;
}

// 期限文字列をDateオブジェクトに変換（YYYY-MM-DD形式を想定）
function parseExpirationDate(expiration: string): Date | null {
  if (!expiration) return null;
  
  // YYYY-MM-DD形式を試す
  const dateMatch = expiration.match(/^\d{4}-\d{2}-\d{2}$/);
  if (dateMatch) {
    return new Date(expiration);
  }
  
  return null;
}

// ページネーション用のカーソル管理
export function paginateDeals(
  deals: Deal[],
  cursor?: string,
  limit: number = 20
): { deals: Deal[]; nextCursor?: string } {
  const startIndex = cursor ? deals.findIndex(d => d.id === cursor) + 1 : 0;
  const endIndex = startIndex + limit;
  
  const paginatedDeals = deals.slice(startIndex, endIndex);
  const nextCursor = endIndex < deals.length ? paginatedDeals[paginatedDeals.length - 1]?.id : undefined;

  return {
    deals: paginatedDeals,
    nextCursor,
  };
}

/**
 * Google Sheets のお得情報を更新
 */
export async function updateDeal(id: string, updates: Partial<Deal>): Promise<void> {
  if (useDealsDb()) {
    const pool = getDbPool();
    await updateDealInDb(pool, id, updates);
    return;
  }

  const { sheets, spreadsheetId, sheetName } = await getGoogleSheetsClient(false);

  // スプレッドシートの全データを取得
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error('スプレッドシートにデータがありません');
  }

  // ヘッダー行を取得してインデックスをマッピング
  const headers = rows[0] as string[];
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    if (header && typeof header === 'string') {
      headerMap[header.toLowerCase().trim()] = index;
    }
  });

  // id列から該当行を検索
  const idIndex = headerMap['id'];
  if (idIndex === undefined) {
    throw new Error('id列が見つかりません');
  }

  const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[idIndex] === id);
  if (rowIndex === -1) {
    throw new Error(`ID: ${id} のデータが見つかりません`);
  }

  // 更新する行のデータを取得
  const targetRow = [...rows[rowIndex]];

  // 更新可能なフィールドを反映
  const updateFields: Array<{ key: keyof Deal; column: string }> = [
    { key: 'title', column: 'title' },
    { key: 'summary', column: 'summary' },
    { key: 'detail', column: 'detail' },
    { key: 'steps', column: 'steps' },
    { key: 'service', column: 'service' },
    { key: 'expiration', column: 'expiration' },
    { key: 'conditions', column: 'conditions' },
    { key: 'notes', column: 'notes' },
    { key: 'category_main', column: 'category_main' },
    { key: 'priority', column: 'priority' },
    { key: 'discount_rate', column: 'discount_rate' },
    { key: 'discount_amount', column: 'discount_amount' },
    { key: 'score', column: 'score' },
    { key: 'area_type', column: 'area_type' },
    { key: 'target_user_type', column: 'target_user_type' },
    { key: 'is_public', column: 'is_public' },
    { key: 'is_welkatsu', column: 'is_welkatsu' },
  ];

  updateFields.forEach(({ key, column }) => {
    const colIndex = headerMap[column.toLowerCase()];
    if (colIndex !== undefined && updates[key] !== undefined) {
      const value = updates[key];
      // boolean 値を 'TRUE' / 'FALSE' に変換
      if (typeof value === 'boolean') {
        targetRow[colIndex] = value ? 'TRUE' : 'FALSE';
      } else {
        targetRow[colIndex] = value?.toString() || '';
      }
    }
  });

  // updated_at を現在時刻に更新
  const updatedAtIndex = headerMap['updated_at'];
  if (updatedAtIndex !== undefined) {
    targetRow[updatedAtIndex] = new Date().toISOString();
  }

  // Google Sheets に更新を反映（A列からZ列まで）
  const range = `${sheetName}!A${rowIndex + 1}:Z${rowIndex + 1}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: {
      values: [targetRow],
    },
  });

  console.log(`✅ ID: ${id} のデータを更新しました`);
}

