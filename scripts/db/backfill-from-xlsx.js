/**
 * Backfill Postgres from TokuSearch.xlsx (snapshot).
 *
 * - Resolves duplicates:
 *   - deals: pick row with latest updated_at (fallback created_at)
 *   - admin_users: pick row with latest last_login (fallback created_at)
 * - Normalizes:
 *   - TRUE/FALSE/true/false -> boolean
 *   - '' / 'null' / null -> null
 *
 * Usage:
 *   node scripts/db/backfill-from-xlsx.js --file=TokuSearch.xlsx --db-url=... [--dry-run]
 *
 * Env alternative:
 *   DATABASE_URL=... node scripts/db/backfill-from-xlsx.js
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { Client } = require('pg');

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
}

const filePath = arg('file') || 'TokuSearch.xlsx';
const dryRun = process.argv.includes('--dry-run');
const dbUrl = arg('db-url') || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL（または --db-url）が必要です');
  process.exit(1);
}

function normNull(v) {
  if (v === undefined) return null;
  if (v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '') return null;
    if (t.toLowerCase() === 'null') return null;
    return v;
  }
  return v;
}

function normBool(v) {
  v = normNull(v);
  if (v === null) return null;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return null;
}

function normInt(v) {
  v = normNull(v);
  if (v === null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function normNum(v) {
  v = normNull(v);
  if (v === null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normIso(v) {
  v = normNull(v);
  if (v === null) return null;
  if (v instanceof Date) return v.toISOString();
  const s = String(v).trim();
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function pickLatestBy(items, getTs) {
  let picked = items[0];
  let best = getTs(picked) || '';
  for (const it of items.slice(1)) {
    const cur = getTs(it) || '';
    if (cur > best) {
      best = cur;
      picked = it;
    }
  }
  return picked;
}

function sheetToObjects(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet not found: ${sheetName}`);
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
  const header = (rows[0] || []).map((v) => (typeof v === 'string' ? v.trim() : v));
  const dataRows = rows
    .slice(1)
    .filter((r) => Array.isArray(r) && r.some((c) => c !== null && c !== ''));
  const idx = {};
  header.forEach((h, i) => {
    if (h) idx[String(h).toLowerCase()] = i;
  });
  const items = dataRows.map((r, rowIndex) => ({ r, rowIndex: rowIndex + 2 }));
  return { idx, items };
}

function upsertDealSql() {
  return `
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
      date=EXCLUDED.date,
      title=EXCLUDED.title,
      summary=EXCLUDED.summary,
      detail=EXCLUDED.detail,
      steps=EXCLUDED.steps,
      service=EXCLUDED.service,
      expiration=EXCLUDED.expiration,
      conditions=EXCLUDED.conditions,
      notes=EXCLUDED.notes,
      category_main=EXCLUDED.category_main,
      category_sub=EXCLUDED.category_sub,
      is_public=EXCLUDED.is_public,
      priority=EXCLUDED.priority,
      discount_rate=EXCLUDED.discount_rate,
      discount_amount=EXCLUDED.discount_amount,
      score=EXCLUDED.score,
      created_at=LEAST(deals.created_at, EXCLUDED.created_at),
      updated_at=GREATEST(deals.updated_at, EXCLUDED.updated_at),
      difficulty=EXCLUDED.difficulty,
      area_type=EXCLUDED.area_type,
      target_user_type=EXCLUDED.target_user_type,
      usage_type=EXCLUDED.usage_type,
      is_welkatsu=EXCLUDED.is_welkatsu,
      tags=EXCLUDED.tags
  `;
}

function upsertAdminSql() {
  return `
    INSERT INTO admin_users (
      id, username, password_hash, display_name, email, role, created_at, last_login
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8
    )
    ON CONFLICT (username) DO UPDATE SET
      id=EXCLUDED.id,
      password_hash=EXCLUDED.password_hash,
      display_name=EXCLUDED.display_name,
      email=EXCLUDED.email,
      role=EXCLUDED.role,
      created_at=COALESCE(admin_users.created_at, EXCLUDED.created_at),
      last_login=GREATEST(COALESCE(admin_users.last_login, '1970-01-01'::timestamptz), COALESCE(EXCLUDED.last_login, '1970-01-01'::timestamptz))
  `;
}

function insertConflictSql() {
  return `
    INSERT INTO migration_conflicts (entity, conflict_key, reason, picked_ref, dropped_refs, payload)
    VALUES ($1,$2,$3,$4,$5,$6::jsonb)
  `;
}

async function main() {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ xlsxが見つかりません: ${filePath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(filePath, { cellDates: true });
  const conflictLog = { deals: [], admin_users: [] };
  const client = new Client({ connectionString: dbUrl });

  if (!dryRun) await client.connect();

  try {
    const { idx: dIdx, items: dItems } = sheetToObjects(wb, 'database');
    const byId = new Map();
    for (const it of dItems) {
      const id = normNull(it.r[dIdx['id']]);
      if (!id) continue;
      const key = String(id);
      if (!byId.has(key)) byId.set(key, []);
      byId.get(key).push(it);
    }

    const pickedDeals = [];
    for (const [id, group] of byId.entries()) {
      if (group.length === 1) {
        pickedDeals.push(group[0]);
        continue;
      }
      const picked = pickLatestBy(group, (x) => normIso(x.r[dIdx['updated_at']]) || normIso(x.r[dIdx['created_at']]) || '');
      const dropped = group.filter((g) => g !== picked);
      conflictLog.deals.push({ id, reason: 'duplicate id in xlsx(database)', picked_row: picked.rowIndex, dropped_rows: dropped.map((d) => d.rowIndex) });
      pickedDeals.push(picked);
    }

    console.log(`📦 deals: input=${dItems.length}, byId=${byId.size}, picked=${pickedDeals.length}, dup=${conflictLog.deals.length}`);

    if (!dryRun) {
      await client.query('BEGIN');
      const dealSql = upsertDealSql();
      const conflictSql = insertConflictSql();

      for (const it of pickedDeals) {
        const r = it.r;
        const createdAt = normIso(r[dIdx['created_at']]) || `${String(r[dIdx['date']]).trim()}T00:00:00.000Z`;
        const updatedAt = normIso(r[dIdx['updated_at']]) || createdAt;
        await client.query(dealSql, [
          String(normNull(r[dIdx['id']])),
          String(normNull(r[dIdx['date']])),
          String(normNull(r[dIdx['title']])),
          normNull(r[dIdx['summary']]),
          normNull(r[dIdx['detail']]),
          normNull(r[dIdx['steps']]),
          normNull(r[dIdx['service']]),
          normNull(r[dIdx['expiration']]),
          normNull(r[dIdx['conditions']]),
          normNull(r[dIdx['notes']]),
          String(normNull(r[dIdx['category_main']] || 'その他')),
          normNull(r[dIdx['category_sub']]),
          normBool(r[dIdx['is_public']]) ?? true,
          String(normNull(r[dIdx['priority']] || 'C')).slice(0, 1),
          normNum(r[dIdx['discount_rate']]),
          normInt(r[dIdx['discount_amount']]),
          normInt(r[dIdx['score']]) ?? 0,
          createdAt,
          updatedAt,
          normNull(r[dIdx['difficulty']]),
          normNull(r[dIdx['area_type']]),
          normNull(r[dIdx['target_user_type']]),
          normNull(r[dIdx['usage_type']]),
          normBool(r[dIdx['is_welkatsu']]),
          normNull(r[dIdx['tags']]),
        ]);
      }

      for (const c of conflictLog.deals) {
        await client.query(conflictSql, ['deals', c.id, c.reason, `row:${c.picked_row}`, c.dropped_rows.map((n) => `row:${n}`).join(','), JSON.stringify(c)]);
      }

      const { idx: aIdx, items: aItems } = sheetToObjects(wb, 'admin_users');
      const byUsername = new Map();
      for (const it of aItems) {
        const username = normNull(it.r[aIdx['username']]);
        if (!username) continue;
        const key = String(username);
        if (!byUsername.has(key)) byUsername.set(key, []);
        byUsername.get(key).push(it);
      }

      const pickedAdmins = [];
      for (const [username, group] of byUsername.entries()) {
        if (group.length === 1) {
          pickedAdmins.push(group[0]);
          continue;
        }
        const picked = pickLatestBy(group, (x) => normIso(x.r[aIdx['last_login']]) || normIso(x.r[aIdx['created_at']]) || '');
        const dropped = group.filter((g) => g !== picked);
        conflictLog.admin_users.push({ username, reason: 'duplicate username in xlsx(admin_users)', picked_row: picked.rowIndex, dropped_rows: dropped.map((d) => d.rowIndex) });
        pickedAdmins.push(picked);
      }

      console.log(`👤 admin_users: input=${aItems.length}, byUsername=${byUsername.size}, picked=${pickedAdmins.length}, dup=${conflictLog.admin_users.length}`);

      const adminSql = upsertAdminSql();
      for (const it of pickedAdmins) {
        const r = it.r;
        await client.query(adminSql, [
          String(normNull(r[aIdx['id']])),
          String(normNull(r[aIdx['username']])),
          String(normNull(r[aIdx['password_hash']] || '')),
          normNull(r[aIdx['display_name']]),
          normNull(r[aIdx['email']]),
          String(normNull(r[aIdx['role']] || 'editor')),
          normIso(r[aIdx['created_at']]),
          normIso(r[aIdx['last_login']]),
        ]);
      }

      for (const c of conflictLog.admin_users) {
        await client.query(conflictSql, ['admin_users', c.username, c.reason, `row:${c.picked_row}`, c.dropped_rows.map((n) => `row:${n}`).join(','), JSON.stringify(c)]);
      }

      await client.query('COMMIT');
    } else {
      console.log('🧪 dry-run: DB insert skipped');
    }

    const outPath = path.join('debug', 'migration-conflicts.json');
    fs.mkdirSync('debug', { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(conflictLog, null, 2), 'utf8');
    console.log(`📝 conflict log: ${outPath}`);
  } catch (e) {
    if (!dryRun) {
      try { await client.query('ROLLBACK'); } catch {}
    }
    console.error('❌ backfill failed:', e);
    process.exitCode = 1;
  } finally {
    if (!dryRun) await client.end();
  }
}

main();

