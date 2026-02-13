import { Pool } from 'pg';
import type { WelkatsuPlaybookRow, WelkatsuPlaybookContentJson } from '@/types/welkatsu-playbook';

function mapRow(row: Record<string, unknown>): WelkatsuPlaybookRow {
  return {
    id: String(row.id),
    month: String(row.month),
    title: String(row.title ?? ''),
    summary: row.summary != null ? String(row.summary) : null,
    content_json: (row.content_json ?? {}) as WelkatsuPlaybookContentJson,
    sources_json: row.sources_json != null ? (row.sources_json as WelkatsuPlaybookRow['sources_json']) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

/** 現在の年月を YYYY-MM で返す */
export function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** 指定月の playbook を1件取得 */
export async function getWelkatsuPlaybookForMonth(
  pool: Pool,
  month: string
): Promise<WelkatsuPlaybookRow | null> {
  const { rows } = await pool.query(
    `SELECT id, month, title, summary, content_json, sources_json, created_at, updated_at
     FROM welkatsu_playbooks
     WHERE month = $1
     LIMIT 1`,
    [month]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export interface WelkatsuPlaybookIngestItem {
  id?: string;
  month: string;
  title: string;
  summary?: string | null;
  content_json: WelkatsuPlaybookContentJson;
  sources_json?: WelkatsuPlaybookRow['sources_json'];
}

function toId(month: string): string {
  return `welkatsu-${month}`;
}

/** Ingest用: 1件または複数件を upsert */
export async function upsertWelkatsuPlaybooks(
  pool: Pool,
  items: WelkatsuPlaybookIngestItem[]
): Promise<{ upserted: number }> {
  if (items.length === 0) return { upserted: 0 };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let upserted = 0;
    for (const it of items) {
      const id = it.id ?? toId(it.month);
      const summary = it.summary ?? null;
      const sources = it.sources_json ?? null;
      await client.query(
        `INSERT INTO welkatsu_playbooks (id, month, title, summary, content_json, sources_json, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           month = EXCLUDED.month,
           title = EXCLUDED.title,
           summary = EXCLUDED.summary,
           content_json = EXCLUDED.content_json,
           sources_json = EXCLUDED.sources_json,
           updated_at = NOW()`,
        [id, it.month, it.title, summary, JSON.stringify(it.content_json), sources ? JSON.stringify(sources) : null]
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
