/**
 * Apply schema.sql on deploy (Vercel build).
 * Skips when DATABASE_URL is not set so builds without DB still succeed.
 *
 * Usage: node scripts/db/migrate.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.log('⏭️ DATABASE_URL not set, skipping migration');
    return;
  }

  const schemaPath = path.join(process.cwd(), 'scripts', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query(sql);
    console.log('✅ schema.sql applied');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ failed to apply schema.sql');
  console.error(err.message || err);
  process.exit(1);
});
