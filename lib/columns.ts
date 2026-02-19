import { Column, ColumnStatus } from '@/types/column';
import { getDbPool } from '@/lib/db';
import {
  fetchColumnsFromDb,
  getColumnByIdFromDb,
  getColumnBySlugFromDb,
  getRelatedColumnsFromDb,
  getPopularColumnsFromDb,
  getAllCategoriesFromDb,
  createColumnInDb,
  updateColumnInDb,
  deleteColumnInDb,
  incrementColumnViewCountInDb,
} from '@/lib/columns-db';
import { getCached, CACHE_TTL_PUBLIC_MS } from '@/lib/cache';

// コラム一覧を取得
export async function fetchColumnsFromSheet(
  options?: {
    status?: ColumnStatus;
    category?: string;
    featured?: boolean;
  }
): Promise<Column[]> {
  const pool = getDbPool();
  const wantPublished = options?.status === 'published' || options?.status === undefined;
  if (wantPublished) {
    const columns = await getCached('columns:published', CACHE_TTL_PUBLIC_MS, () =>
      fetchColumnsFromDb(pool, { status: 'published' })
    );
    let result = columns;
    if (options?.category) result = result.filter((col) => col.category === options.category);
    if (options?.featured !== undefined) result = result.filter((col) => col.is_featured === options.featured);
    return result;
  }
  return fetchColumnsFromDb(pool, options);
}

// 特定のコラムを取得（slugまたはid）
export async function getColumnBySlug(slug: string): Promise<Column | null> {
  const pool = getDbPool();
  const decodedSlug = decodeURIComponent(slug);
  const bySlug = await getColumnBySlugFromDb(pool, decodedSlug);
  if (bySlug) return bySlug;
  const all = await fetchColumnsFromDb(pool, { status: 'published' });
  return all.find((col) => generateSlug(col.title) === decodedSlug) || null;
}

export async function getColumnById(id: string): Promise<Column | null> {
  const pool = getDbPool();
  return getColumnByIdFromDb(pool, id);
}

// コラムを作成
export async function createColumn(data: Omit<Column, 'id' | 'created_at' | 'updated_at'>): Promise<Column> {
  const pool = getDbPool();
  return createColumnInDb(pool, data);
}

// コラムを更新
export async function updateColumn(id: string, data: Partial<Column>): Promise<Column | null> {
  const pool = getDbPool();
  return updateColumnInDb(pool, id, data);
}

// コラムを削除
export async function deleteColumn(id: string): Promise<boolean> {
  const pool = getDbPool();
  return deleteColumnInDb(pool, id);
}

// 閲覧数を増やす
export async function incrementViewCount(id: string): Promise<void> {
  const pool = getDbPool();
  await incrementColumnViewCountInDb(pool, id);
}

// スラッグ生成
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 関連記事を取得（同一カテゴリの新着順、現在の記事を除く）
export async function getRelatedColumns(
  currentColumnId: string,
  category: string,
  limit: number = 3
): Promise<Column[]> {
  const pool = getDbPool();
  return getRelatedColumnsFromDb(pool, currentColumnId, category, limit);
}

// 人気コラムを取得（view_count降順）
export async function getPopularColumns(limit: number = 5): Promise<Column[]> {
  const pool = getDbPool();
  return getPopularColumnsFromDb(pool, limit);
}

// 全カテゴリを取得（動的サイドナビ用）
export async function getAllCategories(): Promise<string[]> {
  const pool = getDbPool();
  return getAllCategoriesFromDb(pool);
}

// ページネーション用の関数（ページ番号ベース）
export function paginateColumns(
  columns: Column[],
  page: number = 1,
  limit: number = 12
): { columns: Column[]; totalPages: number; currentPage: number; total: number } {
  const total = columns.length;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));

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
