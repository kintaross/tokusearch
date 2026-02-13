-- TokuSearch DB schema (PostgreSQL) - SINGLE SOURCE OF TRUTH
-- Use this file only (previous duplicates were removed).

BEGIN;

-- =========================
-- deals
-- =========================
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  detail TEXT,
  steps TEXT,
  service TEXT,
  expiration TEXT,
  conditions TEXT,
  notes TEXT,
  category_main TEXT NOT NULL,
  category_sub TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  priority CHAR(1) NOT NULL DEFAULT 'C',
  discount_rate NUMERIC(6,2),
  discount_amount INTEGER,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  difficulty TEXT,
  area_type TEXT,
  target_user_type TEXT,
  usage_type TEXT,
  is_welkatsu BOOLEAN,
  tags TEXT
);

CREATE INDEX IF NOT EXISTS idx_deals_public_created_at ON deals (is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_category_created_at ON deals (category_main, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_priority_created_at ON deals (priority, created_at DESC);

-- =========================
-- admin_users
-- =========================
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
);

-- =========================
-- columns
-- =========================
CREATE TABLE IF NOT EXISTS columns (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  content_markdown TEXT,
  content_html TEXT,
  category TEXT,
  tags TEXT,
  thumbnail_url TEXT,
  author TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_columns_status_published_at ON columns (status, published_at DESC NULLS LAST);

-- =========================
-- column_themes (コラムテーマ)
-- =========================
CREATE TABLE IF NOT EXISTS column_themes (
  no         INTEGER PRIMARY KEY,
  level      TEXT,
  theme      TEXT NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  used_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_column_themes_used_no ON column_themes (used, no);

-- =========================
-- column_requests (承認フロー用)
-- =========================
CREATE TABLE IF NOT EXISTS column_requests (
  request_id       TEXT PRIMARY KEY,
  source           TEXT,
  channel_id       TEXT,
  thread_ts        TEXT,
  parent_thread_ts TEXT,
  original_text    TEXT,
  themes_json      TEXT,
  status           TEXT NOT NULL DEFAULT 'pending', -- pending/completed/rejected
  created_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_column_requests_status_created_at ON column_requests (status, created_at DESC NULLS LAST);

-- =========================
-- migration_conflicts (optional but recommended)
-- =========================
CREATE TABLE IF NOT EXISTS migration_conflicts (
  id            BIGSERIAL PRIMARY KEY,
  entity        TEXT NOT NULL,
  conflict_key  TEXT NOT NULL,
  reason        TEXT NOT NULL,
  picked_ref    TEXT,
  dropped_refs  TEXT,
  payload       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- users (一般ユーザー・Googleログイン)
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  google_sub     TEXT NOT NULL UNIQUE,
  email          TEXT,
  name           TEXT,
  avatar_url     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users (google_sub);

-- =========================
-- user_favorites (お気に入り)
-- =========================
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, deal_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites (user_id);

-- =========================
-- user_saved_deals (保存済みお得)
-- =========================
CREATE TABLE IF NOT EXISTS user_saved_deals (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id    TEXT NOT NULL,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  list_id    TEXT,
  PRIMARY KEY (user_id, deal_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_deals_user_id ON user_saved_deals (user_id);

-- =========================
-- user_deal_notes (お得ごとのメモ)
-- =========================
CREATE TABLE IF NOT EXISTS user_deal_notes (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id    TEXT NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, deal_id)
);

CREATE INDEX IF NOT EXISTS idx_user_deal_notes_user_id ON user_deal_notes (user_id);

-- =========================
-- user_saved_searches (保存検索)
-- =========================
CREATE TABLE IF NOT EXISTS user_saved_searches (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  query_json  JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_saved_searches_user_id ON user_saved_searches (user_id);

-- =========================
-- user_deal_transactions (お得活動の入出金)
-- =========================
CREATE TABLE IF NOT EXISTS user_deal_transactions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id     TEXT,
  occurred_on DATE NOT NULL,
  direction   TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  value_type  TEXT NOT NULL CHECK (value_type IN ('cash', 'points', 'other')),
  amount      NUMERIC(12,2) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  memo        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_deal_transactions_user_id ON user_deal_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_deal_transactions_deal_id ON user_deal_transactions (deal_id);
CREATE INDEX IF NOT EXISTS idx_user_deal_transactions_occurred_on ON user_deal_transactions (occurred_on);

-- =========================
-- welkatsu_playbooks (当日攻略・20日特化)
-- =========================
CREATE TABLE IF NOT EXISTS welkatsu_playbooks (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content_json JSONB NOT NULL,
  sources_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_welkatsu_playbooks_month ON welkatsu_playbooks (month);

COMMIT;
