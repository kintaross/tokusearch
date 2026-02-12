/**
 * Apply Postgres schema from scripts/db/schema.sql
 *
 * Usage:
 *   set DATABASE_URL or POSTGRES_URL
 *   npx ts-node scripts/db/apply-schema.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) throw new Error('DATABASE_URL or POSTGRES_URL is required');

  const schemaPath = path.join(process.cwd(), 'scripts', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }

  // Avoid printing DATABASE_URL (secrets) in logs.
  console.log('✅ schema.sql applied');
}

main().catch((err) => {
  console.error('❌ failed to apply schema.sql');
  console.error(err);
  process.exitCode = 1;
});

