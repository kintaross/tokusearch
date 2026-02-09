# xlsx → Postgres バックフィル手順（TokuSearch）

このドキュメントは `TokuSearch.xlsx` を **PostgreSQL** に投入（バックフィル）するための実行手順です。  
重複（`database`の同一`id`、`admin_users`の同一`username`）は **自動解決**し、落ちた行は `debug/` に退避ログを出します。

---

## 前提

- Node.js（本リポジトリと同じバージョン帯）
- Postgres（Vercel Postgres / Supabase / Neon 等）
- 環境変数 `DATABASE_URL`（または `POSTGRES_URL`）が設定済み

---

## 1) スキーマ作成

`scripts/db/schema.sql` をDBで実行してください（VercelならSQL Editor、SupabaseならSQL Editorなど）。

- 対象テーブル:
  - `deals`
  - `admin_users`
  - `columns`
  - `column_themes`
  - `column_requests`

---

## 2) バックフィル実行（deals / admin_users）

プロジェクトルートで:

```powershell
$env:DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DBNAME"
npx ts-node scripts/db/backfill-from-xlsx.ts --file=TokuSearch.xlsx
```

成功すると、以下が作成されます。

- `debug/db-backfill-summary.json`
- `debug/db-backfill-conflicts-deals.json`
- `debug/db-backfill-conflicts-admin-users.json`

---

## 3) 重要：重複の扱い（仕様）

- **deals（`database`）**:
  - 同一 `id` が複数行ある場合、`updated_at` が最新の行を採用（なければ `created_at`、それもなければ行順）
  - それ以外の行は `debug/db-backfill-conflicts-deals.json` に記録

- **admin_users**:
  - 同一 `username` が複数行ある場合、`last_login` が最新の行を採用（なければ `created_at`、それもなければ行順）
  - それ以外の行は `debug/db-backfill-conflicts-admin-users.json` に記録

---

## 4) 注意（安全運用）

- バックフィルは **UPSERT** です（既存ID/usernameがあっても更新します）
- 本番で実施する場合は、念のため
  - DBのスナップショット/バックアップ
  - `deals/admin_users` の行数チェック
  - `debug/*conflicts*.json` のレビュー
  を行ってください。

