/**
 * Backfill Postgres from TokuSearch.xlsx
 *
 * Features:
 * - Reads sheets: database (deals), admin_users
 * - Normalizes types (TRUE/true/'null'/'' etc)
 * - Resolves duplicates:
 *   - deals: pick the row with the latest updated_at (fallback created_at, then row order)
 *   - admin_users: pick the row with the latest last_login (fallback created_at, then row order)
 * - Writes conflict logs to debug/ for human review
 *
 * Usage:
 *   set DATABASE_URL or POSTGRES_URL
 *   npx ts-node scripts/db/backfill-from-xlsx.ts --file=TokuSearch.xlsx
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import XLSX from 'xlsx';
import { Client } from 'pg';

type AnyRow = Record<string, any>;

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function normalizeString(v: any): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    const s = v.trim();
    if (s === '' || s.toLowerCase() === 'null') return null;
    return s;
  }
  // numbers / booleans etc
  return String(v);
}

function normalizeBoolean(v: any): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (s === '' || s === 'null') return null;
  if (s === 'true' || s === 't' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === 'f' || s === '0' || s === 'no') return false;
  if (s === 'true'.toLowerCase()) return true;
  // Sheets style
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'true') return true;
  // Uppercase TRUE/FALSE already lowercased above
  return null;
}

function normalizeNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).trim();
  if (s === '' || s.toLowerCase() === 'null') return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function normalizeInt(v: any): number | null {
  const n = normalizeNumber(v);
  if (n === null) return null;
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function normalizeDateOnly(v: any): string | null {
  const s = normalizeString(v);
  if (!s) return null;
  // allow YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // excel date object?
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function normalizeTimestamp(v: any): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) {
    const t = v.getTime();
    if (Number.isNaN(t)) return null;
    return v.toISOString();
  }
  const s = normalizeString(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function pickLatestRow(rows: AnyRow[], tsFields: string[]): { chosen: AnyRow; rejected: AnyRow[] } {
  const scored = rows
    .map((r, idx) => {
      const ts = tsFields
        .map((f) => normalizeTimestamp(r[f]))
        .map((t) => (t ? new Date(t).getTime() : -1))
        .find((t) => t !== -1) ?? -1;
      return { r, idx, ts };
    })
    .sort((a, b) => (b.ts - a.ts) || (b.idx - a.idx));
  const chosen = scored[0]!.r;
  const rejected = scored.slice(1).map((x) => x.r);
  return { chosen, rejected };
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function sheetToObjects(wb: XLSX.WorkBook, sheetName: string): AnyRow[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet not found: ${sheetName}`);
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true }) as any[][];
  if (rows.length === 0) return [];
  const header = (rows[0] ?? []).map((h: any) => (typeof h === 'string' ? h.trim() : String(h ?? '')));
  const out: AnyRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => c === null || c === '')) continue;
    const obj: AnyRow = { __rowNumber: i + 1 };
    for (let j = 0; j < header.length; j++) {
      const key = header[j] || `col_${j}`;
      obj[key] = row[j] ?? null;
    }
    out.push(obj);
  }
  return out;
}

async function main() {
  const file = argValue('file') ?? 'TokuSearch.xlsx';
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) throw new Error('DATABASE_URL or POSTGRES_URL is required');

  const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  if (!fs.existsSync(abs)) throw new Error(`XLSX not found: ${abs}`);

  const wb = XLSX.readFile(abs, { cellDates: true });
  const debugDir = path.join(process.cwd(), 'debug');
  ensureDir(debugDir);

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const summary: any = { file: abs, startedAt: new Date().toISOString(), deals: {}, admin_users: {} };

  // ===== deals =====
  {
    const rows = sheetToObjects(wb, 'database');
    const byId = new Map<string, AnyRow[]>();
    for (const r of rows) {
      const id = normalizeString(r['id']);
      if (!id) continue;
      const arr = byId.get(id) ?? [];
      arr.push(r);
      byId.set(id, arr);
    }

    const conflicts: any[] = [];
    const chosenRows: AnyRow[] = [];

    for (const [id, same] of byId.entries()) {
      if (same.length === 1) {
        chosenRows.push(same[0]!);
        continue;
      }
      const { chosen, rejected } = pickLatestRow(same, ['updated_at', 'created_at']);
      chosenRows.push(chosen);
      conflicts.push({
        type: 'deal_id_duplicate',
        id,
        chosenRow: chosen.__rowNumber,
        rejectedRows: rejected.map((r) => r.__rowNumber),
      });
    }

    // upsert
    let upserted = 0;
    for (const r of chosenRows) {
      const id = normalizeString(r['id'])!;
      const date = normalizeDateOnly(r['date']) ?? normalizeDateOnly(r['created_at']) ?? new Date().toISOString().slice(0, 10);
      const createdAt = normalizeTimestamp(r['created_at']) ?? `${date}T00:00:00.000Z`;
      const updatedAt = normalizeTimestamp(r['updated_at']) ?? createdAt;

      const isPublic = normalizeBoolean(r['is_public']);
      const isWelkatsu = normalizeBoolean(r['is_welkatsu']);

      const discountRate = normalizeNumber(r['discount_rate']);
      const discountAmount = normalizeInt(r['discount_amount']);
      const score = normalizeInt(r['score']) ?? 0;

      const sql = `
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
      `;

      const values = [
        id,
        date,
        normalizeString(r['title']) ?? '',
        normalizeString(r['summary']),
        normalizeString(r['detail']),
        normalizeString(r['steps']),
        normalizeString(r['service']),
        normalizeString(r['expiration']),
        normalizeString(r['conditions']),
        normalizeString(r['notes']),
        normalizeString(r['category_main']) ?? 'その他',
        normalizeString(r['category_sub']),
        isPublic ?? true,
        (normalizeString(r['priority']) ?? 'C').slice(0, 1),
        discountRate,
        discountAmount,
        score,
        createdAt,
        updatedAt,
        normalizeString(r['difficulty']),
        normalizeString(r['area_type']),
        normalizeString(r['target_user_type']),
        normalizeString(r['usage_type']),
        isWelkatsu,
        normalizeString(r['tags']),
      ];

      await client.query(sql, values);
      upserted++;
    }

    const conflictPath = path.join(debugDir, 'db-backfill-conflicts-deals.json');
    fs.writeFileSync(conflictPath, JSON.stringify(conflicts, null, 2), 'utf8');

    summary.deals = {
      inputRows: rows.length,
      uniqueIds: byId.size,
      chosenRows: chosenRows.length,
      conflicts: conflicts.length,
      conflictsFile: conflictPath,
      upserted,
    };
  }

  // ===== admin_users =====
  {
    const rows = sheetToObjects(wb, 'admin_users');
    const byUsername = new Map<string, AnyRow[]>();
    for (const r of rows) {
      const u = normalizeString(r['username']);
      if (!u) continue;
      const arr = byUsername.get(u) ?? [];
      arr.push(r);
      byUsername.set(u, arr);
    }

    const conflicts: any[] = [];
    const chosenRows: AnyRow[] = [];

    for (const [username, same] of byUsername.entries()) {
      if (same.length === 1) {
        chosenRows.push(same[0]!);
        continue;
      }
      const { chosen, rejected } = pickLatestRow(same, ['last_login', 'created_at']);
      chosenRows.push(chosen);
      conflicts.push({
        type: 'admin_username_duplicate',
        username,
        chosenRow: chosen.__rowNumber,
        rejectedRows: rejected.map((r) => r.__rowNumber),
      });
    }

    let upserted = 0;
    for (const r of chosenRows) {
      const id = normalizeString(r['id']) ?? `user-${Date.now()}`;
      const username = normalizeString(r['username'])!;
      const createdAt = normalizeTimestamp(r['created_at']) ?? new Date().toISOString();
      const lastLogin = normalizeTimestamp(r['last_login']);

      const sql = `
        INSERT INTO admin_users (
          id, username, password_hash, display_name, email, role, created_at, last_login
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          display_name = EXCLUDED.display_name,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          created_at = LEAST(admin_users.created_at, EXCLUDED.created_at),
          last_login = GREATEST(admin_users.last_login, EXCLUDED.last_login)
      `;

      const values = [
        id,
        username,
        normalizeString(r['password_hash']) ?? '',
        normalizeString(r['display_name']),
        normalizeString(r['email']),
        normalizeString(r['role']) ?? 'editor',
        createdAt,
        lastLogin,
      ];

      await client.query(sql, values);
      upserted++;
    }

    const conflictPath = path.join(debugDir, 'db-backfill-conflicts-admin-users.json');
    fs.writeFileSync(conflictPath, JSON.stringify(conflicts, null, 2), 'utf8');

    summary.admin_users = {
      inputRows: rows.length,
      uniqueUsernames: byUsername.size,
      chosenRows: chosenRows.length,
      conflicts: conflicts.length,
      conflictsFile: conflictPath,
      upserted,
    };
  }

  // ===== columns =====
  {
    let rows: AnyRow[] = [];
    try {
      rows = sheetToObjects(wb, 'columns');
    } catch (e) {
      console.log('⚠️ columns sheet not found, skip');
      rows = [];
    }

    let upserted = 0;
    for (const r of rows) {
      const id = normalizeString(r['id']);
      const slug = normalizeString(r['slug']);
      const title = normalizeString(r['title']);
      if (!id || !slug || !title) continue;

      const createdAt = normalizeTimestamp(r['created_at']) ?? new Date().toISOString();
      const updatedAt = normalizeTimestamp(r['updated_at']) ?? createdAt;
      const publishedAt = normalizeTimestamp(r['published_at']);

      const isFeatured = normalizeBoolean(r['is_featured']) ?? false;
      const viewCount = normalizeInt(r['view_count']) ?? 0;

      await client.query(
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
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          content_markdown = EXCLUDED.content_markdown,
          content_html = EXCLUDED.content_html,
          category = EXCLUDED.category,
          tags = EXCLUDED.tags,
          thumbnail_url = EXCLUDED.thumbnail_url,
          author = EXCLUDED.author,
          status = EXCLUDED.status,
          is_featured = EXCLUDED.is_featured,
          view_count = EXCLUDED.view_count,
          created_at = LEAST(columns.created_at, EXCLUDED.created_at),
          updated_at = GREATEST(columns.updated_at, EXCLUDED.updated_at),
          published_at = EXCLUDED.published_at
        `,
        [
          id,
          slug,
          title,
          normalizeString(r['description']),
          normalizeString(r['content_markdown']) ?? '',
          normalizeString(r['content_html']) ?? '',
          normalizeString(r['category']) ?? 'その他',
          normalizeString(r['tags']) ?? '',
          normalizeString(r['thumbnail_url']) ?? '',
          normalizeString(r['author']) ?? '',
          normalizeString(r['status']) ?? 'draft',
          isFeatured,
          viewCount,
          createdAt,
          updatedAt,
          publishedAt,
        ]
      );
      upserted++;
    }

    summary.columns = { inputRows: rows.length, upserted };
  }

  // ===== column_themes =====
  {
    let rows: AnyRow[] = [];
    try {
      rows = sheetToObjects(wb, 'column_themes');
    } catch (e) {
      console.log('⚠️ column_themes sheet not found, skip');
      rows = [];
    }

    let upserted = 0;
    for (const r of rows) {
      const no = normalizeInt(r['no']);
      const theme = normalizeString(r['theme']);
      if (!no || !theme) continue;
      const used = normalizeBoolean(r['used']) ?? false;
      const usedAt = normalizeTimestamp(r['used_at']);

      await client.query(
        `
        INSERT INTO column_themes (no, level, theme, used, used_at)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (no) DO UPDATE SET
          level = EXCLUDED.level,
          theme = EXCLUDED.theme,
          used = EXCLUDED.used,
          used_at = EXCLUDED.used_at
        `,
        [no, normalizeString(r['level']), theme, used, usedAt]
      );
      upserted++;
    }

    summary.column_themes = { inputRows: rows.length, upserted };
  }

  // ===== column_requests =====
  {
    let rows: AnyRow[] = [];
    try {
      rows = sheetToObjects(wb, 'column_requests');
    } catch (e) {
      console.log('⚠️ column_requests sheet not found, skip');
      rows = [];
    }

    let upserted = 0;
    for (const r of rows) {
      const requestId = normalizeString(r['request_id']);
      if (!requestId) continue;

      await client.query(
        `
        INSERT INTO column_requests (
          request_id, source, channel_id, thread_ts, parent_thread_ts,
          original_text, themes_json, status, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (request_id) DO UPDATE SET
          source = EXCLUDED.source,
          channel_id = EXCLUDED.channel_id,
          thread_ts = EXCLUDED.thread_ts,
          parent_thread_ts = EXCLUDED.parent_thread_ts,
          original_text = EXCLUDED.original_text,
          themes_json = EXCLUDED.themes_json,
          status = EXCLUDED.status,
          created_at = COALESCE(column_requests.created_at, EXCLUDED.created_at)
        `,
        [
          requestId,
          normalizeString(r['source']),
          normalizeString(r['channel_id']),
          normalizeString(r['thread_ts']),
          normalizeString(r['parent_thread_ts']),
          normalizeString(r['original_text']),
          normalizeString(r['themes_json']),
          normalizeString(r['status']) ?? 'pending',
          normalizeTimestamp(r['created_at']) ?? new Date().toISOString(),
        ]
      );
      upserted++;
    }

    summary.column_requests = { inputRows: rows.length, upserted };
  }

  const summaryPath = path.join(debugDir, 'db-backfill-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  await client.end();
  console.log('✅ Backfill complete');
  console.log(JSON.stringify({ summaryFile: summaryPath, ...summary }, null, 2));
}

main().catch((e) => {
  console.error('❌ Backfill failed:', e);
  process.exitCode = 1;
});

