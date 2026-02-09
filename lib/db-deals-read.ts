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

