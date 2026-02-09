import { Pool } from 'pg';
import { Column } from '@/types/column';

function mapRow(row: any): Column {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    content_markdown: String(row.content_markdown ?? ''),
    content_html: String(row.content_html ?? ''),
    category: (row.category ?? 'その他') as any,
    tags: String(row.tags ?? ''),
    thumbnail_url: String(row.thumbnail_url ?? ''),
    author: String(row.author ?? ''),
    status: (row.status ?? 'draft') as any,
    is_featured: !!row.is_featured,
    view_count: Number(row.view_count ?? 0),
    created_at: row.created_at ? String(row.created_at) : '',
    updated_at: row.updated_at ? String(row.updated_at) : '',
    published_at: row.published_at ? String(row.published_at) : '',
  };
}

export async function fetchColumnsFromDb(
  pool: Pool,
  options?: { status?: string; category?: string; featured?: boolean }
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

  const sql = `
    SELECT
      id, slug, title, description, content_markdown, content_html, category, tags,
      thumbnail_url, author, status, is_featured, view_count, created_at, updated_at, published_at
    FROM columns
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY created_at DESC NULLS LAST
  `;

  const { rows } = await pool.query(sql, values);
  return rows.map(mapRow);
}

export async function getColumnByIdFromDb(pool: Pool, id: string): Promise<Column | null> {
  const { rows } = await pool.query(
    `
    SELECT
      id, slug, title, description, content_markdown, content_html, category, tags,
      thumbnail_url, author, status, is_featured, view_count, created_at, updated_at, published_at
    FROM columns
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getColumnBySlugFromDb(pool: Pool, slug: string): Promise<Column | null> {
  const { rows } = await pool.query(
    `
    SELECT
      id, slug, title, description, content_markdown, content_html, category, tags,
      thumbnail_url, author, status, is_featured, view_count, created_at, updated_at, published_at
    FROM columns
    WHERE slug = $1
    LIMIT 1
    `,
    [slug]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createColumnInDb(
  pool: Pool,
  data: Omit<Column, 'id' | 'created_at' | 'updated_at'>
): Promise<Column> {
  const now = new Date().toISOString();
  const id = `col-${Date.now()}`;

  const res = await pool.query(
    `
    INSERT INTO columns (
      id, slug, title, description, content_markdown, content_html, category, tags,
      thumbnail_url, author, status, is_featured, view_count, created_at, updated_at, published_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
    )
    RETURNING *
    `,
    [
      id,
      data.slug,
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
      data.view_count,
      now,
      now,
      data.published_at || null,
    ]
  );
  return mapRow(res.rows[0]);
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

  const set: string[] = [];
  const values: any[] = [];
  let i = 1;
  for (const k of allowed) {
    if ((data as any)[k] === undefined) continue;
    set.push(`${String(k)} = $${i++}`);
    values.push((data as any)[k]);
  }
  set.push(`updated_at = NOW()`);
  values.push(id);

  const res = await pool.query(
    `
    UPDATE columns
    SET ${set.join(', ')}
    WHERE id = $${values.length}
    RETURNING *
    `,
    values
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function deleteColumnFromDb(pool: Pool, id: string): Promise<boolean> {
  const res = await pool.query(`DELETE FROM columns WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function incrementColumnViewCountInDb(pool: Pool, id: string): Promise<void> {
  await pool.query(`UPDATE columns SET view_count = view_count + 1, updated_at = NOW() WHERE id = $1`, [id]);
}

