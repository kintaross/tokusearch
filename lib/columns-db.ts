import { Pool } from 'pg';
import { Column, ColumnStatus } from '@/types/column';

function rowToColumn(r: any): Column {
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title ?? ''),
    description: String(r.description ?? ''),
    content_markdown: String(r.content_markdown ?? ''),
    content_html: String(r.content_html ?? ''),
    category: (r.category ?? 'その他') as any,
    tags: String(r.tags ?? ''),
    thumbnail_url: String(r.thumbnail_url ?? ''),
    author: String(r.author ?? ''),
    status: (r.status ?? 'draft') as ColumnStatus,
    is_featured: !!r.is_featured,
    view_count: Number(r.view_count ?? 0) || 0,
    created_at: r.created_at ? String(r.created_at) : '',
    updated_at: r.updated_at ? String(r.updated_at) : '',
    published_at: r.published_at ? String(r.published_at) : '',
  };
}

export async function fetchColumnsFromDb(
  pool: Pool,
  options?: { status?: ColumnStatus; category?: string; featured?: boolean }
): Promise<Column[]> {
  const where: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (options?.status) {
    where.push(`status = $${i++}`);
    values.push(options.status);
  }
  if (options?.category) {
    where.push(`category = $${i++}`);
    values.push(options.category);
  }
  if (options?.featured !== undefined) {
    where.push(`is_featured = $${i++}`);
    values.push(options.featured);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `
    SELECT
      id, slug, title, description, content_markdown, content_html,
      category, tags, thumbnail_url, author, status, is_featured, view_count,
      created_at, updated_at, published_at
    FROM columns
    ${whereSql}
    ORDER BY COALESCE(published_at, created_at) DESC NULLS LAST
    `,
    values
  );

  return rows.map(rowToColumn);
}

export async function getColumnByIdFromDb(pool: Pool, id: string): Promise<Column | null> {
  const { rows } = await pool.query(
    `
    SELECT
      id, slug, title, description, content_markdown, content_html,
      category, tags, thumbnail_url, author, status, is_featured, view_count,
      created_at, updated_at, published_at
    FROM columns
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );
  return rows[0] ? rowToColumn(rows[0]) : null;
}

export async function getColumnBySlugFromDb(pool: Pool, slug: string): Promise<Column | null> {
  const { rows } = await pool.query(
    `
    SELECT
      id, slug, title, description, content_markdown, content_html,
      category, tags, thumbnail_url, author, status, is_featured, view_count,
      created_at, updated_at, published_at
    FROM columns
    WHERE slug = $1
    LIMIT 1
    `,
    [slug]
  );
  return rows[0] ? rowToColumn(rows[0]) : null;
}

async function resolveUniqueSlug(pool: Pool, baseSlug: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT slug FROM columns WHERE slug = $1 OR slug LIKE $2`,
    [baseSlug, `${baseSlug}-%`]
  );
  if (rows.length === 0) return baseSlug;

  const existing = new Set(rows.map((r: any) => String(r.slug)));
  if (!existing.has(baseSlug)) return baseSlug;

  for (let i = 2; i < 1000; i++) {
    const candidate = `${baseSlug}-${i}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${baseSlug}-${Date.now()}`;
}

export async function createColumnInDb(
  pool: Pool,
  data: Omit<Column, 'id' | 'created_at' | 'updated_at'>
): Promise<Column> {
  const now = new Date().toISOString();
  const id = `col-${Date.now()}`;
  const slug = await resolveUniqueSlug(pool, data.slug);

  const publishedAt = data.status === 'published' ? (data.published_at || now) : data.published_at || '';

  const { rows } = await pool.query(
    `
    INSERT INTO columns (
      id, slug, title, description, content_markdown, content_html,
      category, tags, thumbnail_url, author, status, is_featured, view_count,
      created_at, updated_at, published_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,
      $7,$8,$9,$10,$11,$12,$13,
      $14,$15,$16
    )
    RETURNING
      id, slug, title, description, content_markdown, content_html,
      category, tags, thumbnail_url, author, status, is_featured, view_count,
      created_at, updated_at, published_at
    `,
    [
      id,
      slug,
      data.title,
      data.description,
      data.content_markdown,
      data.content_html,
      data.category,
      data.tags,
      data.thumbnail_url,
      data.author,
      data.status,
      data.is_featured,
      data.view_count ?? 0,
      now,
      now,
      publishedAt || null,
    ]
  );

  return rowToColumn(rows[0]);
}

export async function updateColumnInDb(pool: Pool, id: string, data: Partial<Column>): Promise<Column | null> {
  const allowed: Array<keyof Column> = [
    'slug',
    'title',
    'description',
    'content_markdown',
    'content_html',
    'category',
    'tags',
    'thumbnail_url',
    'author',
    'status',
    'is_featured',
    'view_count',
    'published_at',
  ];

  const setParts: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const k of allowed) {
    if (data[k] === undefined) continue;
    setParts.push(`${String(k)} = $${i++}`);
    values.push((data as any)[k]);
  }

  setParts.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `
    UPDATE columns
    SET ${setParts.join(', ')}
    WHERE id = $${i}
    RETURNING
      id, slug, title, description, content_markdown, content_html,
      category, tags, thumbnail_url, author, status, is_featured, view_count,
      created_at, updated_at, published_at
    `,
    values
  );

  return rows[0] ? rowToColumn(rows[0]) : null;
}

export async function deleteColumnInDb(pool: Pool, id: string): Promise<boolean> {
  const { rowCount } = await pool.query(`DELETE FROM columns WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

export async function incrementColumnViewCountInDb(pool: Pool, id: string): Promise<void> {
  await pool.query(`UPDATE columns SET view_count = view_count + 1, updated_at = NOW() WHERE id = $1`, [id]);
}

/** Related columns by category (lightweight: no content_markdown). */
export async function getRelatedColumnsFromDb(
  pool: Pool,
  excludeId: string,
  category: string,
  limit: number = 3
): Promise<Column[]> {
  const { rows } = await pool.query(
    `
    SELECT id, slug, title, description, '' AS content_markdown, '' AS content_html,
      category, tags, thumbnail_url, author, status, is_featured, view_count,
      created_at, updated_at, published_at
    FROM columns
    WHERE status = 'published' AND category = $1 AND id != $2
    ORDER BY COALESCE(published_at, created_at) DESC NULLS LAST
    LIMIT $3
    `,
    [category, excludeId, limit]
  );
  return rows.map(rowToColumn);
}

/** Popular columns by view_count (lightweight: no content_markdown). */
export async function getPopularColumnsFromDb(pool: Pool, limit: number = 5): Promise<Column[]> {
  const { rows } = await pool.query(
    `
    SELECT id, slug, title, description, '' AS content_markdown, '' AS content_html,
      category, tags, thumbnail_url, author, status, is_featured, view_count,
      created_at, updated_at, published_at
    FROM columns
    WHERE status = 'published'
    ORDER BY view_count DESC NULLS LAST
    LIMIT $1
    `,
    [limit]
  );
  return rows.map(rowToColumn);
}

/** All categories for side nav. */
export async function getAllCategoriesFromDb(pool: Pool): Promise<string[]> {
  const { rows } = await pool.query<{ category: string }>(
    `SELECT DISTINCT category FROM columns WHERE status = 'published' AND category IS NOT NULL AND category != '' ORDER BY category`,
    []
  );
  return rows.map((r) => r.category);
}

