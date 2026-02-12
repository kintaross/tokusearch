import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// ---------- Favorites ----------
export async function getFavorites(pool: Pool, userId: string): Promise<string[]> {
  const r = await pool.query<{ deal_id: string }>(
    'SELECT deal_id FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return r.rows.map((row) => row.deal_id);
}

export async function setFavorites(pool: Pool, userId: string, dealIds: string[]): Promise<void> {
  await pool.query('DELETE FROM user_favorites WHERE user_id = $1', [userId]);
  for (const dealId of dealIds) {
    await pool.query(
      'INSERT INTO user_favorites (user_id, deal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, dealId]
    );
  }
}

export async function addFavorite(pool: Pool, userId: string, dealId: string): Promise<void> {
  await pool.query(
    'INSERT INTO user_favorites (user_id, deal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, dealId]
  );
}

export async function removeFavorite(pool: Pool, userId: string, dealId: string): Promise<void> {
  await pool.query('DELETE FROM user_favorites WHERE user_id = $1 AND deal_id = $2', [
    userId,
    dealId,
  ]);
}

// ---------- Saved deals ----------
export async function getSavedDeals(pool: Pool, userId: string): Promise<string[]> {
  const r = await pool.query<{ deal_id: string }>(
    'SELECT deal_id FROM user_saved_deals WHERE user_id = $1 ORDER BY saved_at DESC',
    [userId]
  );
  return r.rows.map((row) => row.deal_id);
}

export async function addSavedDeal(pool: Pool, userId: string, dealId: string): Promise<void> {
  await pool.query(
    `INSERT INTO user_saved_deals (user_id, deal_id) VALUES ($1, $2)
     ON CONFLICT (user_id, deal_id) DO UPDATE SET saved_at = NOW()`,
    [userId, dealId]
  );
}

export async function removeSavedDeal(pool: Pool, userId: string, dealId: string): Promise<void> {
  await pool.query('DELETE FROM user_saved_deals WHERE user_id = $1 AND deal_id = $2', [
    userId,
    dealId,
  ]);
}

// ---------- Deal notes ----------
export interface UserDealNote {
  deal_id: string;
  note: string;
  updated_at: string;
}

export async function getDealNote(
  pool: Pool,
  userId: string,
  dealId: string
): Promise<string | null> {
  const r = await pool.query<{ note: string }>(
    'SELECT note FROM user_deal_notes WHERE user_id = $1 AND deal_id = $2',
    [userId, dealId]
  );
  return r.rows[0]?.note ?? null;
}

export async function setDealNote(
  pool: Pool,
  userId: string,
  dealId: string,
  note: string
): Promise<void> {
  await pool.query(
    `INSERT INTO user_deal_notes (user_id, deal_id, note, updated_at) VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, deal_id) DO UPDATE SET note = $3, updated_at = NOW()`,
    [userId, dealId, note ?? '']
  );
}

// ---------- Saved searches ----------
export interface SavedSearch {
  id: string;
  name: string;
  query_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function getSavedSearches(
  pool: Pool,
  userId: string
): Promise<SavedSearch[]> {
  const r = await pool.query<SavedSearch & { query_json: unknown }>(
    'SELECT id, name, query_json, created_at, updated_at FROM user_saved_searches WHERE user_id = $1 ORDER BY updated_at DESC',
    [userId]
  );
  return r.rows.map((row) => ({
    id: row.id,
    name: row.name,
    query_json: (row.query_json as Record<string, unknown>) ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createSavedSearch(
  pool: Pool,
  userId: string,
  name: string,
  queryJson: Record<string, unknown>
): Promise<SavedSearch> {
  const id = `ss-${uuidv4()}`;
  await pool.query(
    'INSERT INTO user_saved_searches (id, user_id, name, query_json) VALUES ($1, $2, $3, $4)',
    [id, userId, name, JSON.stringify(queryJson)]
  );
  const r = await pool.query<SavedSearch & { query_json: unknown }>(
    'SELECT id, name, query_json, created_at, updated_at FROM user_saved_searches WHERE id = $1',
    [id]
  );
  const row = r.rows[0];
  return {
    id: row.id,
    name: row.name,
    query_json: (row.query_json as Record<string, unknown>) ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function updateSavedSearch(
  pool: Pool,
  userId: string,
  id: string,
  data: { name?: string; query_json?: Record<string, unknown> }
): Promise<boolean> {
  if (data.name !== undefined) {
    await pool.query('UPDATE user_saved_searches SET name = $2, updated_at = NOW() WHERE id = $1 AND user_id = $3', [
      id,
      data.name,
      userId,
    ]);
  }
  if (data.query_json !== undefined) {
    await pool.query(
      'UPDATE user_saved_searches SET query_json = $2, updated_at = NOW() WHERE id = $1 AND user_id = $3',
      [id, JSON.stringify(data.query_json), userId]
    );
  }
  const r = await pool.query('SELECT 1 FROM user_saved_searches WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return r.rowCount !== null && r.rowCount > 0;
}

export async function deleteSavedSearch(
  pool: Pool,
  userId: string,
  id: string
): Promise<boolean> {
  const r = await pool.query('DELETE FROM user_saved_searches WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return r.rowCount !== null && r.rowCount > 0;
}

// ---------- Transactions ----------
export type TransactionDirection = 'in' | 'out';
export type TransactionValueType = 'cash' | 'points' | 'other';
export type TransactionStatus = 'pending' | 'confirmed';

export interface UserDealTransaction {
  id: string;
  user_id: string;
  deal_id: string | null;
  occurred_on: string;
  direction: TransactionDirection;
  value_type: TransactionValueType;
  amount: number;
  status: TransactionStatus;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export async function getTransactions(
  pool: Pool,
  userId: string,
  opts?: { dealId?: string; from?: string; to?: string }
): Promise<UserDealTransaction[]> {
  let query =
    'SELECT id, user_id, deal_id, occurred_on::text, direction, value_type, amount::float, status, memo, created_at, updated_at FROM user_deal_transactions WHERE user_id = $1';
  const params: (string | number)[] = [userId];
  let i = 2;
  if (opts?.dealId) {
    query += ` AND deal_id = $${i}`;
    params.push(opts.dealId);
    i++;
  }
  if (opts?.from) {
    query += ` AND occurred_on >= $${i}`;
    params.push(opts.from);
    i++;
  }
  if (opts?.to) {
    query += ` AND occurred_on <= $${i}`;
    params.push(opts.to);
    i++;
  }
  query += ' ORDER BY occurred_on DESC, created_at DESC';
  const r = await pool.query(query, params);
  return r.rows as UserDealTransaction[];
}

export async function createTransaction(
  pool: Pool,
  userId: string,
  data: {
    deal_id?: string | null;
    occurred_on: string;
    direction: TransactionDirection;
    value_type: TransactionValueType;
    amount: number;
    status?: TransactionStatus;
    memo?: string | null;
  }
): Promise<UserDealTransaction> {
  const id = `tx-${uuidv4()}`;
  await pool.query(
    `INSERT INTO user_deal_transactions (id, user_id, deal_id, occurred_on, direction, value_type, amount, status, memo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      userId,
      data.deal_id ?? null,
      data.occurred_on,
      data.direction,
      data.value_type,
      data.amount,
      data.status ?? 'pending',
      data.memo ?? null,
    ]
  );
  const r = await pool.query<UserDealTransaction>(
    'SELECT id, user_id, deal_id, occurred_on::text, direction, value_type, amount::float, status, memo, created_at, updated_at FROM user_deal_transactions WHERE id = $1',
    [id]
  );
  return r.rows[0];
}

export async function updateTransaction(
  pool: Pool,
  userId: string,
  id: string,
  data: Partial<{
    deal_id: string | null;
    occurred_on: string;
    direction: TransactionDirection;
    value_type: TransactionValueType;
    amount: number;
    status: TransactionStatus;
    memo: string | null;
  }>
): Promise<boolean> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (data.deal_id !== undefined) {
    fields.push(`deal_id = $${i++}`);
    values.push(data.deal_id);
  }
  if (data.occurred_on !== undefined) {
    fields.push(`occurred_on = $${i++}`);
    values.push(data.occurred_on);
  }
  if (data.direction !== undefined) {
    fields.push(`direction = $${i++}`);
    values.push(data.direction);
  }
  if (data.value_type !== undefined) {
    fields.push(`value_type = $${i++}`);
    values.push(data.value_type);
  }
  if (data.amount !== undefined) {
    fields.push(`amount = $${i++}`);
    values.push(data.amount);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${i++}`);
    values.push(data.status);
  }
  if (data.memo !== undefined) {
    fields.push(`memo = $${i++}`);
    values.push(data.memo);
  }
  if (fields.length === 0) return true;
  fields.push('updated_at = NOW()');
  values.push(id, userId);
  const r = await pool.query(
    `UPDATE user_deal_transactions SET ${fields.join(', ')} WHERE id = $${i} AND user_id = $${i + 1}`,
    values as string[]
  );
  return r.rowCount !== null && r.rowCount > 0;
}

export async function deleteTransaction(
  pool: Pool,
  userId: string,
  id: string
): Promise<boolean> {
  const r = await pool.query('DELETE FROM user_deal_transactions WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return r.rowCount !== null && r.rowCount > 0;
}

/** Deal別・期間内の確定済み入出金集計 */
export interface DealSummary {
  deal_id: string | null;
  total_in: number;
  total_out: number;
  by_type: Record<string, { in: number; out: number }>;
}

export async function getDealAnalytics(
  pool: Pool,
  userId: string,
  opts: { from?: string; to?: string; dealId?: string }
): Promise<DealSummary[]> {
  let query = `
    SELECT deal_id, direction, value_type, SUM(amount) as sum
    FROM user_deal_transactions
    WHERE user_id = $1 AND status = 'confirmed'
  `;
  const params: string[] = [userId];
  let i = 2;
  if (opts.from) {
    query += ` AND occurred_on >= $${i++}`;
    params.push(opts.from);
  }
  if (opts.to) {
    query += ` AND occurred_on <= $${i++}`;
    params.push(opts.to);
  }
  if (opts.dealId) {
    query += ` AND deal_id = $${i++}`;
    params.push(opts.dealId);
  }
  query += ' GROUP BY deal_id, direction, value_type';
  const r = await pool.query<{ deal_id: string | null; direction: string; value_type: string; sum: string }>(
    query,
    params
  );
  const map = new Map<string | null, DealSummary>();
  for (const row of r.rows) {
    const key = row.deal_id;
    if (!map.has(key)) {
      map.set(key, {
        deal_id: key,
        total_in: 0,
        total_out: 0,
        by_type: {},
      });
    }
    const s = map.get(key)!;
    const sum = parseFloat(row.sum);
    const typeKey = row.value_type;
    if (!s.by_type[typeKey]) s.by_type[typeKey] = { in: 0, out: 0 };
    if (row.direction === 'in') {
      s.total_in += sum;
      s.by_type[typeKey].in += sum;
    } else {
      s.total_out += sum;
      s.by_type[typeKey].out += sum;
    }
  }
  return Array.from(map.values());
}
