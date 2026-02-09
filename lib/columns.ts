import { google } from 'googleapis';
import { Column, ColumnStatus } from '@/types/column';
import { getDbPool } from '@/lib/db';
import {
  fetchColumnsFromDb,
  getColumnByIdFromDb,
  getColumnBySlugFromDb,
  createColumnInDb,
  updateColumnInDb,
  deleteColumnInDb,
  incrementColumnViewCountInDb,
} from '@/lib/columns-db';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
const COLUMNS_SHEET_NAME = 'columns';

function useColumnsDb(): boolean {
  const mode = (process.env.COLUMNS_DATA_SOURCE || '').toLowerCase();
  return mode === 'db' || process.env.COLUMNS_USE_DB === 'true';
}

async function getGoogleSheetsClient() {
  const credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// コラム一覧を取得
export async function fetchColumnsFromSheet(
  options?: {
    status?: ColumnStatus;
    category?: string;
    featured?: boolean;
  }
): Promise<Column[]> {
  try {
    if (useColumnsDb()) {
      const pool = getDbPool();
      return await fetchColumnsFromDb(pool, options);
    }

    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${COLUMNS_SHEET_NAME}!A2:P`,
    });

    const rows = response.data.values || [];
    let columns = rows.map((row) => ({
      id: row[0] || '',
      slug: row[1] || '',
      title: row[2] || '',
      description: row[3] || '',
      content_markdown: row[4] || '',
      content_html: row[5] || '',
      category: row[6] || 'その他',
      tags: row[7] || '',
      thumbnail_url: row[8] || '',
      author: row[9] || '',
      status: (row[10] || 'draft') as ColumnStatus,
      is_featured: row[11] === 'TRUE',
      view_count: parseInt(row[12] || '0', 10),
      created_at: row[13] || '',
      updated_at: row[14] || '',
      published_at: row[15] || '',
    }));

    // フィルタリング
    if (options?.status) {
      columns = columns.filter((col) => col.status === options.status);
    }
    if (options?.category) {
      columns = columns.filter((col) => col.category === options.category);
    }
    if (options?.featured !== undefined) {
      columns = columns.filter((col) => col.is_featured === options.featured);
    }

    return columns;
  } catch (error) {
    console.error('Error fetching columns from sheet:', error);
    return [];
  }
}

// 特定のコラムを取得（slugまたはid）
export async function getColumnBySlug(slug: string): Promise<Column | null> {
  if (useColumnsDb()) {
    const pool = getDbPool();
    return await getColumnBySlugFromDb(pool, decodeURIComponent(slug));
  }
  const columns = await fetchColumnsFromSheet();
  
  // URLデコード処理（念のため）
  const decodedSlug = decodeURIComponent(slug);
  
  console.log('🔍 検索slug:', decodedSlug);
  console.log('📊 利用可能なslug:', columns.map(c => c.slug).slice(0, 5));
  
  // 1. 完全一致で検索（slug列の値と比較）
  let found = columns.find((col) => col.slug === decodedSlug);
  
  // 2. 見つからない場合、タイトルから生成したslugで検索（後方互換性のため）
  if (!found) {
    console.log('⚠️ slug列で見つからないため、タイトルから生成して検索...');
    found = columns.find((col) => generateSlug(col.title) === decodedSlug);
    
    if (found) {
      console.log('✅ タイトルから生成したslugで見つかりました:', found.title);
    }
  } else {
    console.log('✅ slug列で見つかりました:', found.title);
  }
  
  if (!found) {
    console.log('❌ 一致するコラムが見つかりません');
    console.log('🔍 検索したslug:', decodedSlug);
    console.log('📋 全てのslug:', columns.map(c => `${c.slug} (${c.title})`));
  }
  
  return found || null;
}

export async function getColumnById(id: string): Promise<Column | null> {
  if (useColumnsDb()) {
    const pool = getDbPool();
    return await getColumnByIdFromDb(pool, id);
  }
  const columns = await fetchColumnsFromSheet();
  return columns.find((col) => col.id === id) || null;
}

// コラムを作成
export async function createColumn(data: Omit<Column, 'id' | 'created_at' | 'updated_at'>): Promise<Column> {
  if (useColumnsDb()) {
    const pool = getDbPool();
    return await createColumnInDb(pool, data);
  }
  const sheets = await getGoogleSheetsClient();
  const now = new Date().toISOString();
  const id = `col-${Date.now()}`;

  const newColumn: Column = {
    ...data,
    id,
    created_at: now,
    updated_at: now,
  };

  const row = [
    newColumn.id,
    newColumn.slug,
    newColumn.title,
    newColumn.description,
    newColumn.content_markdown,
    newColumn.content_html,
    newColumn.category,
    newColumn.tags,
    newColumn.thumbnail_url,
    newColumn.author,
    newColumn.status,
    newColumn.is_featured ? 'TRUE' : 'FALSE',
    newColumn.view_count.toString(),
    newColumn.created_at,
    newColumn.updated_at,
    newColumn.published_at,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${COLUMNS_SHEET_NAME}!A:P`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [row],
    },
  });

  return newColumn;
}

// コラムを更新
export async function updateColumn(id: string, data: Partial<Column>): Promise<Column | null> {
  if (useColumnsDb()) {
    const pool = getDbPool();
    return await updateColumnInDb(pool, id, data);
  }
  const sheets = await getGoogleSheetsClient();
  const columns = await fetchColumnsFromSheet();
  const index = columns.findIndex((col) => col.id === id);

  if (index === -1) {
    return null;
  }

  const existingColumn = columns[index];
  const updatedColumn: Column = {
    ...existingColumn,
    ...data,
    id: existingColumn.id, // IDは変更不可
    created_at: existingColumn.created_at, // 作成日時は変更不可
    updated_at: new Date().toISOString(),
  };

  const row = [
    updatedColumn.id,
    updatedColumn.slug,
    updatedColumn.title,
    updatedColumn.description,
    updatedColumn.content_markdown,
    updatedColumn.content_html,
    updatedColumn.category,
    updatedColumn.tags,
    updatedColumn.thumbnail_url,
    updatedColumn.author,
    updatedColumn.status,
    updatedColumn.is_featured ? 'TRUE' : 'FALSE',
    updatedColumn.view_count.toString(),
    updatedColumn.created_at,
    updatedColumn.updated_at,
    updatedColumn.published_at,
  ];

  const rowNumber = index + 2; // ヘッダー行を考慮
  
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${COLUMNS_SHEET_NAME}!A${rowNumber}:P${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });
  } catch (error: any) {
    console.error('Google Sheets update error:', error);
    // セルサイズ制限エラーの可能性
    if (error.message?.includes('exceeds') || error.message?.includes('limit')) {
      throw new Error('画像が大きすぎます。より小さな画像（500KB以下）を選択してください。');
    }
    throw new Error('コラムの更新に失敗しました: ' + (error.message || 'Unknown error'));
  }

  return updatedColumn;
}

// コラムを削除
export async function deleteColumn(id: string): Promise<boolean> {
  if (useColumnsDb()) {
    const pool = getDbPool();
    return await deleteColumnInDb(pool, id);
  }
  const sheets = await getGoogleSheetsClient();
  const columns = await fetchColumnsFromSheet();
  const index = columns.findIndex((col) => col.id === id);

  if (index === -1) {
    return false;
  }

  const rowNumber = index + 2; // ヘッダー行を考慮
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0, // columnsシートのID（後で調整が必要な場合あり）
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });

  return true;
}

// 閲覧数を増やす
export async function incrementViewCount(id: string): Promise<void> {
  if (useColumnsDb()) {
    const pool = getDbPool();
    await incrementColumnViewCountInDb(pool, id);
    return;
  }
  const column = await getColumnById(id);
  if (column) {
    await updateColumn(id, {
      view_count: column.view_count + 1,
    });
  }
}

// スラッグ生成
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 関連記事を取得（同一カテゴリの新着順、現在の記事を除く）
export async function getRelatedColumns(currentColumnId: string, category: string, limit: number = 3): Promise<Column[]> {
  const allColumns = await fetchColumnsFromSheet({ status: 'published' });
  
  return allColumns
    .filter(col => col.id !== currentColumnId && col.category === category)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, limit);
}

// 人気コラムを取得（view_count降順）
export async function getPopularColumns(limit: number = 5): Promise<Column[]> {
  const allColumns = await fetchColumnsFromSheet({ status: 'published' });
  
  return allColumns
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, limit);
}

// 全カテゴリを取得（動的サイドナビ用）
export async function getAllCategories(): Promise<string[]> {
  const allColumns = await fetchColumnsFromSheet({ status: 'published' });
  const categories = [...new Set(allColumns.map(col => col.category))];
  return categories.sort();
}

// ページネーション用の関数（ページ番号ベース）
export function paginateColumns(
  columns: Column[],
  page: number = 1,
  limit: number = 12
): { columns: Column[]; totalPages: number; currentPage: number; total: number } {
  const total = columns.length;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages)); // 1以上totalPages以下に制限
  
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedColumns = columns.slice(startIndex, endIndex);

  return {
    columns: paginatedColumns,
    totalPages,
    currentPage,
    total,
  };
}

