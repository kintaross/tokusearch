# DBカットオーバー手順書（1時間Freeze版）

この手順書は、TokuSearch を **Google Sheets中心運用 → PostgreSQL（Neon/Vercel Postgres等）** に切り替える“当日手順（Runbook）”です。  
対象は **deals / columns / column_themes / column_requests / admin_users** と、n8nの **3ワークフロー**（お得情報・コラム自動生成・コラム承認）です。

---

## 0. あなたが今やること（結論チェックリスト）

- **n8nを停止する（Freeze開始）**（あなたは既に実施済み）
- **最新のGoogle Sheetsを xlsx でエクスポート**（例: `TokuSearch.xlsx`）
- **DBに `scripts/db/schema.sql` を適用**
- **バックフィル実行**（`scripts/db/backfill-from-xlsx.ts`）
- **Vercel環境変数をDBに切替**（`DATABASE_URL` 必須。`N8N_API_KEY` を n8n と一致させる）
- **DB版n8nワークフローをimportして有効化**
- **簡易動作確認 → Freeze解除**

---

**注意**: 本番コードは **DB 専用** です。deals / columns / 管理者認証はすべて PostgreSQL を参照します。`DEALS_DATA_SOURCE` や `COLUMNS_DATA_SOURCE` は使用されません。`DATABASE_URL` が必須です。

---

## 1. 前提（ここが揃っていれば実行OK）

- **DBが作成済み**（Neon/Vercel Postgres/Supabase等、PostgreSQLでOK）
- **接続文字列が手元にある**（`DATABASE_URL` 形式）
- **本リポジトリのコードがデプロイ可能な状態**（Ingest APIが含まれていること）
- **n8nの編集権限がある**
- **Freeze中は、管理画面での編集もしない**（同時書き込みを止める）

---

## 2. Freeze（凍結）開始（T-00:00）

- **n8nワークフローを停止**（スケジュール実行が走らない状態にする）
- **（推奨）メンテナンス表示/編集停止**  
  既に用意している運用に合わせて、管理画面の編集を止めてください（参考: `docs/MAINTENANCE_MODE.md`）

---

## 3. 最新データを確定（T-00:05〜）

### 3.1 Google Sheets → xlsx エクスポート

- Google Sheets から **.xlsx** をダウンロード
- ファイル名は例として以下推奨:
  - `TokuSearch-YYYYMMDD-HHMM.xlsx`
- それをこのリポジトリ直下に置く（例: ルートに配置）

### 3.2 xlsxのシート名チェック（重要）

バックフィルは以下のシート名を読みます。

- 必須: `database`（deals）
- 必須: `admin_users`
- 任意（あれば移行）: `columns`, `column_themes`, `column_requests`

※ `column_themes` と `column_requests` は **見つからない場合スキップ**します（ログに警告が出ます）。

---

## 4. DBスキーマ適用（T-00:20〜）

DBのSQL Editor（Neon Console / Vercel Storage / Supabase SQL Editor 等）で、以下を **そのまま実行**します。

- `scripts/db/schema.sql`

作成される主なテーブル:

- `deals`
- `admin_users`
- `columns`
- `column_themes`
- `column_requests`
- `migration_conflicts`（競合退避用）

---

## 5. バックフィル実行（T-00:25〜）

### 5.1 依存関係の準備

未実施ならプロジェクトルートで依存を入れます。

```powershell
npm ci
```

### 5.2 Backfillコマンド（PowerShell）

```powershell
cd C:\Users\ksaka\.cursor\PJ\tokuSearch

# DB接続文字列をセット（Neon/Vercel Postgres の URL）
$env:DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DBNAME"

# xlsxを指定して実行
npx ts-node scripts/db/backfill-from-xlsx.ts --file=TokuSearch-YYYYMMDD-HHMM.xlsx
```

### 5.3 生成物（必ず確認）

成功すると `debug/` に以下が出ます。

- `debug/db-backfill-summary.json`
- `debug/db-backfill-conflicts-deals.json`
- `debug/db-backfill-conflicts-admin-users.json`

conflicts が **0でなくても即NGではありません**（重複が実データに存在するため）。  
ただし件数が極端に多い場合は、xlsxの“取り込んでいるシート”が違う可能性が高いです。

---

## 6. 切替（アプリをDB参照へ）（T-00:40〜）

### 6.1 Vercel（アプリ側）環境変数を設定

Vercelのプロジェクト環境変数に以下を設定します。

- **`DATABASE_URL`**: Postgresの接続文字列（必須。deals / columns / admin_users はすべて DB 参照）
- **`N8N_API_KEY`**: n8nと共有するAPIキー（ランダムな長めの文字列）

補足:

- `N8N_API_KEY` は **n8n側の `N8N_API_KEY` と完全一致**させます
- 既に `N8N_INGEST_API_KEY` を使っている運用なら、どちらか片方で統一してください（コードは両方を見ます）
- `DEALS_DATA_SOURCE` / `COLUMNS_DATA_SOURCE` は廃止済みで参照されません

### 6.2 デプロイ（環境変数反映）

- Vercelで **Redeploy**（または新しいデプロイ）して、env反映後のコードを本番に出します

---

## 7. n8nワークフローをDB版に差し替え（T-00:50〜）

### 7.1 n8nの環境変数

- n8n側に `N8N_API_KEY` を設定（値はVercelの `N8N_API_KEY` と同じ）

### 7.2 使うワークフローJSON（このリポジトリ）

- お得情報（DB版）: `n8n_workflow/deals-workflow-db-ingest.json`
- コラム自動生成（DB版）: `n8n_workflow/columns-auto-noimage-db.json`
- コラム承認（DB版）: `n8n_workflow/column-approval-db.json`

### 7.3 importと有効化のルール

- **旧（Sheets版）ワークフローは停止したまま**
- DB版を import → Credentials/ENV参照が正しいか確認 → **有効化**
- 可能なら **手動実行（Execute）で1回流す**（失敗したらFreeze解除前に直す）

401が出る場合はほぼ `x-api-key` 不一致です（`N8N_API_KEY` を見直してください）。

---

## 8. 受入確認（最低限）（T-00:55〜）

Freeze解除前に最低限これだけ確認します。

- **公開ページ**: `/` や `/shinchaku` で一覧が出る
- **詳細ページ**: 既知の `id` の `/deals/[id]` が表示できる
- **管理画面**: deals編集（更新）が反映される
- **n8n**: DB版ワークフローが1回成功する（dealsが `POST /api/ingest/deals` で通る）

---

## 9. Freeze解除（T-01:00）

- メンテナンス/編集停止を解除
- n8nのスケジュール実行を再開（DB版ワークフローが有効であること）
- 以降、**Sheetsへ書き込むワークフローは使わない**（DBが陳腐化します）

---

## 10. ロールバック（不具合が出たら最短で戻す）

### 10.1 アプリ側をSheetsへ戻す

Vercel環境変数を戻してRedeployします。**コードは DB 専用のため、ロールバックするには以前のコミットに戻す必要があります。** そのうえで:

- `DATABASE_URL` を外すと起動失敗するため、ロールバック時も一時的に旧 DB または復旧用 DB を指すようにする

### 10.2 n8n側をSheets版へ戻す

- DB版ワークフローを停止
- 旧（Sheets版）ワークフローを有効化

※ ロールバックしても、DBは残ります。落ち着いて原因を潰してから再度カットオーバーできます。

