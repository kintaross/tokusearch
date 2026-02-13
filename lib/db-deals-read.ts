import { Pool } from 'pg';
import { Deal } from '@/types/deal';

function toNumberOrUndefined(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : undefined;
}

function mapRowToDeal(row: any): Deal {
  return {
    id: String(row.id),
    date: String(row.date),
    title: String(row.title ?? ''),
    summary: String(row.summary ?? ''),
    detail: String(row.detail ?? ''),
    steps: String(row.steps ?? ''),
    service: String(row.service ?? ''),
    expiration: String(row.expiration ?? ''),
    conditions: String(row.conditions ?? ''),
    notes: String(row.notes ?? ''),
    category_main: (row.category_main ?? 'その他') as Deal['category_main'],
    category_sub: row.category_sub ?? undefined,
    is_public: !!row.is_public,
    priority: (row.priority ?? 'C') as Deal['priority'],
    discount_rate: toNumberOrUndefined(row.discount_rate),
    discount_amount: toNumberOrUndefined(row.discount_amount),
    score: toNumberOrUndefined(row.score) ?? 0,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    difficulty: row.difficulty ?? undefined,
    area_type: row.area_type ?? undefined,
    target_user_type: row.target_user_type ?? undefined,
    usage_type: row.usage_type ?? undefined,
    is_welkatsu: row.is_welkatsu ?? undefined,
    tags: row.tags ?? undefined,
  };
}

export async function fetchDealsFromDb(pool: Pool, opts?: { includePrivate?: boolean }): Promise<Deal[]> {
  const includePrivate = opts?.includePrivate === true;

  const { rows } = await pool.query(
    `
    SELECT
      id, date, title, summary, detail, steps, service, expiration, conditions, notes,
      category_main, category_sub, is_public, priority, discount_rate, discount_amount, score,
      created_at, updated_at, difficulty, area_type, target_user_type, usage_type, is_welkatsu, tags
    FROM deals
    ${includePrivate ? '' : 'WHERE is_public = TRUE'}
    ORDER BY created_at DESC
    `
  );

  return rows.map(mapRowToDeal);
}

export interface FetchDealsFilteredOpts {
  category?: string;
  search?: string;
  period?: 'today' | '3days' | '7days' | '30days';
  sort?: 'default' | 'newest' | 'expiring' | 'discount_rate' | 'discount_amount' | 'score';
  limit?: number;
  offset?: number;
}

/** Filtered + sorted + paginated deals with total count (DB-side). Use when DEALS_DATA_SOURCE=db. */
export async function fetchDealsFiltered(
  pool: Pool,
  opts: FetchDealsFilteredOpts = {}
): Promise<{ deals: Deal[]; total: number }> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  const where: string[] = ['is_public = TRUE'];
  const values: unknown[] = [];
  let i = 1;

  if (opts.category) {
    where.push(`category_main = $${i++}`);
    values.push(opts.category);
  }
  if (opts.search && opts.search.trim()) {
    const term = `%${opts.search.trim().toLowerCase()}%`;
    where.push(
      `(LOWER(title) LIKE $${i} OR LOWER(COALESCE(summary,'')) LIKE $${i} OR LOWER(COALESCE(detail,'')) LIKE $${i} OR LOWER(COALESCE(service,'')) LIKE $${i} OR LOWER(COALESCE(notes,'')) LIKE $${i})`
    );
    values.push(term);
    i++;
  }
  if (opts.period) {
    switch (opts.period) {
      case 'today':
        where.push(`created_at >= NOW() - INTERVAL '24 hours'`);
        break;
      case '3days':
        where.push(`created_at >= NOW() - INTERVAL '3 days'`);
        break;
      case '7days':
        where.push(`created_at >= NOW() - INTERVAL '7 days'`);
        break;
      case '30days':
        where.push(`created_at >= NOW() - INTERVAL '30 days'`);
        break;
    }
  }
  // default: no period filter but match sheets "10 days" for default view
  if (!opts.period && !opts.category && !opts.search && (opts.sort === 'default' || !opts.sort)) {
    where.push(`created_at >= NOW() - INTERVAL '10 days'`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  let orderBy: string;
  switch (opts.sort) {
    case 'newest':
      orderBy = 'ORDER BY created_at DESC NULLS LAST, id';
      break;
    case 'expiring':
      orderBy = `ORDER BY CASE WHEN expiration ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN (expiration::date) ELSE '9999-12-31'::date END ASC NULLS LAST, id`;
      break;
    case 'discount_rate':
      orderBy = 'ORDER BY discount_rate DESC NULLS LAST, id';
      break;
    case 'discount_amount':
      orderBy = 'ORDER BY discount_amount DESC NULLS LAST, id';
      break;
    case 'score':
      orderBy = 'ORDER BY score DESC NULLS LAST, id';
      break;
    case 'default':
    default:
      orderBy = `ORDER BY CASE WHEN expiration ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN (expiration::date) ELSE '9999-12-31'::date END ASC NULLS LAST,
        CASE priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END,
        created_at DESC NULLS LAST, id`;
  }

  const { rows } = await pool.query(
    `
    WITH filtered AS (
      SELECT
        id, date, title, summary, detail, steps, service, expiration, conditions, notes,
        category_main, category_sub, is_public, priority, discount_rate, discount_amount, score,
        created_at, updated_at, difficulty, area_type, target_user_type, usage_type, is_welkatsu, tags,
        COUNT(*) OVER() AS _total
      FROM deals
      ${whereSql}
    )
    SELECT * FROM filtered
    ${orderBy}
    LIMIT ${limit} OFFSET ${offset}
    `,
    values
  );

  const total = rows[0]?._total != null ? Number(rows[0]._total) : 0;
  const deals = rows.map((r: any) => {
    const { _total, ...rest } = r;
    return mapRowToDeal(rest);
  });

  return { deals, total };
}

/** Fetch multiple deals by ids (for favorites/batch). */
export async function fetchDealsByIdsFromDb(pool: Pool, ids: string[]): Promise<Deal[]> {
  if (ids.length === 0) return [];

  const { rows } = await pool.query(
    `
    SELECT
      id, date, title, summary, detail, steps, service, expiration, conditions, notes,
      category_main, category_sub, is_public, priority, discount_rate, discount_amount, score,
      created_at, updated_at, difficulty, area_type, target_user_type, usage_type, is_welkatsu, tags
    FROM deals
    WHERE is_public = TRUE AND id = ANY($1::text[])
    ORDER BY created_at DESC
    `,
    [ids]
  );

  const byId = new Map(rows.map((r: any) => [r.id, mapRowToDeal(r)]));
  return ids.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
}

export async function fetchDealByIdFromDb(
  pool: Pool,
  id: string,
  opts?: { includePrivate?: boolean }
): Promise<Deal | null> {
  const includePrivate = opts?.includePrivate === true;

  const { rows } = await pool.query(
    `
    SELECT
      id, date, title, summary, detail, steps, service, expiration, conditions, notes,
      category_main, category_sub, is_public, priority, discount_rate, discount_amount, score,
      created_at, updated_at, difficulty, area_type, target_user_type, usage_type, is_welkatsu, tags
    FROM deals
    WHERE id = $1
    ${includePrivate ? '' : 'AND is_public = TRUE'}
    LIMIT 1
    `,
    [id]
  );

  return rows[0] ? mapRowToDeal(rows[0]) : null;
}

export async function updateDealInDb(pool: Pool, id: string, updates: Partial<Deal>): Promise<void> {
  const allowed: Array<keyof Deal> = [
    'title',
    'summary',
    'detail',
    'steps',
    'service',
    'expiration',
    'conditions',
    'notes',
    'category_main',
    'priority',
    'discount_rate',
    'discount_amount',
    'score',
    'area_type',
    'target_user_type',
    'is_public',
    'is_welkatsu',
  ];

  const setParts: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const key of allowed) {
    if (updates[key] === undefined) continue;
    setParts.push(`${String(key)} = $${i}`);
    values.push((updates as any)[key]);
    i++;
  }

  // nothing to update
  if (setParts.length === 0) return;

  setParts.push(`updated_at = NOW()`);
  values.push(id);

  await pool.query(`UPDATE deals SET ${setParts.join(', ')} WHERE id = $${i}`, values);
}

