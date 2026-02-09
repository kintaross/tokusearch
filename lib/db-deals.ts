import { Pool } from 'pg';
import { Deal } from '@/types/deal';

function toNullableString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === '' || s.toLowerCase() === 'null') return null;
  return s;
}

function toBooleanOrNull(v: unknown): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (s === 'true' || s === 't' || s === '1' || s === 'yes' || s === 'y' || s === 'on') return true;
  if (s === 'false' || s === 'f' || s === '0' || s === 'no' || s === 'n' || s === 'off') return false;
  // Google Sheetsは "TRUE"/"FALSE" を返すことがある
  if (s === 'true' || s === 'false') return s === 'true';
  return null;
}

function toNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).trim();
  if (s === '' || s.toLowerCase() === 'null') return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function toNullableInt(v: unknown): number | null {
  const n = toNullableNumber(v);
  return n === null ? null : Math.trunc(n);
}

function toIsoOrNow(v: unknown, fallback?: string): string {
  const s = toNullableString(v);
  if (s) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallback || new Date().toISOString();
}

function toDateOnlyOrToday(v: unknown): string {
  const s = toNullableString(v);
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return new Date().toISOString().slice(0, 10);
}

export function normalizeDealForDb(input: Partial<Deal> & { id: string }) {
  const created_at = toIsoOrNow((input as any).created_at);
  const updated_at = toIsoOrNow((input as any).updated_at, created_at);

  return {
    id: String(input.id),
    date: toDateOnlyOrToday((input as any).date),
    title: toNullableString((input as any).title) || '',
    summary: toNullableString((input as any).summary),
    detail: toNullableString((input as any).detail),
    steps: toNullableString((input as any).steps),
    service: toNullableString((input as any).service),
    expiration: toNullableString((input as any).expiration),
    conditions: toNullableString((input as any).conditions),
    notes: toNullableString((input as any).notes),
    category_main: toNullableString((input as any).category_main) || 'その他',
    category_sub: toNullableString((input as any).category_sub),
    is_public: toBooleanOrNull((input as any).is_public) ?? true,
    priority: (toNullableString((input as any).priority) || 'C').slice(0, 1),
    discount_rate: toNullableNumber((input as any).discount_rate),
    discount_amount: toNullableInt((input as any).discount_amount),
    score: toNullableInt((input as any).score) ?? 0,
    created_at,
    updated_at,
    difficulty: toNullableString((input as any).difficulty),
    area_type: toNullableString((input as any).area_type),
    target_user_type: toNullableString((input as any).target_user_type),
    usage_type: toNullableString((input as any).usage_type),
    is_welkatsu: toBooleanOrNull((input as any).is_welkatsu),
    tags: toNullableString((input as any).tags),
  };
}

export async function upsertDeals(pool: Pool, deals: Array<Partial<Deal> & { id: string }>) {
  if (deals.length === 0) return { upserted: 0 };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let upserted = 0;

    for (const d of deals) {
      const n = normalizeDealForDb(d);
      await client.query(
        `
        INSERT INTO deals (
          id, date, title, summary, detail, steps, service, expiration, conditions, notes,
          category_main, category_sub, is_public, priority, discount_rate, discount_amount, score,
          created_at, updated_at, difficulty, area_type, target_user_type, usage_type, is_welkatsu, tags
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,
          $18,$19,$20,$21,$22,$23,$24,$25
        )
        ON CONFLICT (id) DO UPDATE SET
          date = EXCLUDED.date,
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          detail = EXCLUDED.detail,
          steps = EXCLUDED.steps,
          service = EXCLUDED.service,
          expiration = EXCLUDED.expiration,
          conditions = EXCLUDED.conditions,
          notes = EXCLUDED.notes,
          category_main = EXCLUDED.category_main,
          category_sub = EXCLUDED.category_sub,
          is_public = EXCLUDED.is_public,
          priority = EXCLUDED.priority,
          discount_rate = EXCLUDED.discount_rate,
          discount_amount = EXCLUDED.discount_amount,
          score = EXCLUDED.score,
          created_at = LEAST(deals.created_at, EXCLUDED.created_at),
          updated_at = GREATEST(deals.updated_at, EXCLUDED.updated_at),
          difficulty = EXCLUDED.difficulty,
          area_type = EXCLUDED.area_type,
          target_user_type = EXCLUDED.target_user_type,
          usage_type = EXCLUDED.usage_type,
          is_welkatsu = EXCLUDED.is_welkatsu,
          tags = EXCLUDED.tags
        `,
        [
          n.id,
          n.date,
          n.title,
          n.summary,
          n.detail,
          n.steps,
          n.service,
          n.expiration,
          n.conditions,
          n.notes,
          n.category_main,
          n.category_sub,
          n.is_public,
          n.priority,
          n.discount_rate,
          n.discount_amount,
          n.score,
          n.created_at,
          n.updated_at,
          n.difficulty,
          n.area_type,
          n.target_user_type,
          n.usage_type,
          n.is_welkatsu,
          n.tags,
        ]
      );
      upserted++;
    }

    await client.query('COMMIT');
    return { upserted };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

