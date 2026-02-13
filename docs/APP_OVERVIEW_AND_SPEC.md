# TokuSearch アプリ概要・機能説明書

## 1. アプリ概要

### 1.1 目的・コンセプト

**TokuSearch** は、X（Twitter）などを巡回しなくても、その日のお得情報を効率的に確認できる**閲覧専用**の一般公開サイトです。

- **ターゲット**: お得情報・キャンペーン・ポイント還元に興味のある一般ユーザー
- **提供価値**: 今日チェックすべきお得情報を10秒で把握できる日次ダッシュボード
- **データソース**: Google スプレッドシート または PostgreSQL（環境変数で切替可能）

### 1.2 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 14（App Router） |
| 言語 | TypeScript |
| スタイル | Tailwind CSS |
| 認証 | NextAuth.js（管理画面用） |
| データストア | PostgreSQL / Google Sheets（DEALS_DATA_SOURCE で切替） |
| デプロイ | Vercel 想定 |
| 自動化 | n8n（データ収集・コラム生成・承認フロー） |

### 1.3 主要な用語

- **お得情報（Deal）**: キャンペーン・割引・ポイント還元などの1件の案件データ
- **コラム（Column）**: お得活用の基礎知識やTipsをまとめた記事
- **ウエル活**: 毎月20日付近のウエルシア関連キャンペーン向けお得情報
- **ポイ活検索**: ポイ活サイト横断検索機能（外部サイト「どこ得？」等を利用）

---

## 2. 機能一覧

### 2.1 一般ユーザー向け機能（公開サイト）

#### 2.1.1 トップページ（ホーム）

- **パス**: `/`
- **概要**: 今日のお得ダッシュボード。主要セクションを一覧表示。
- **主な表示内容**:
  - **マストチェック**: 今日特に確認すべきお得（優先度・締切を考慮）
  - **締切間近**: 終了が近い案件
  - **新着**: 過去24時間以内に追加されたお得
  - **カテゴリ別件数**: ドラッグストア・日用品、スーパー・量販店・EC、グルメ・外食、旅行・交通、決済・ポイント、タバコ・嗜好品、その他
  - **ウエル活**: ウエル活期間中は件数・リンクを表示
  - **ランダムコラム**: 公開コラムから1件をピックアップ
- **検索・フィルタ**:
  - フリーワード検索
  - カテゴリ・エリア種別（オンライン/店舗）・期間フィルタ
  - 表示形式: グリッド / リスト切替
  - ページネーション対応

#### 2.1.2 お得情報一覧・詳細

- **一覧**: トップの検索結果および `/` のクエリパラメータで絞り込み表示
- **詳細ページ**: `/deals/[id]`
  - タイトル・概要・詳細・手順・サービス・締切・条件・メモ・カテゴリ・タグ
  - 難易度・利用チャネル・対象ユーザー・用途バッジ（フェーズ2項目）
  - お気に入りボタン・共有ボタン・閲覧数表示
  - 構造化データ（JSON-LD）・OGP 対応

#### 2.1.3 特集・一覧系ページ

| パス | 説明 |
|------|------|
| `/pickup` | 優先度Aの注目お得＋新着お得。トップ3を大きく表示 |
| `/shinchaku` | 過去24時間の新着お得一覧 |
| `/ranking` | スコア・割引額・終了間近の3種ランキング（カテゴリフィルタ可） |
| `/magazine` | 編集部おすすめ・カテゴリ別特集（決済・ポイント、グルメ・外食、旅行・交通など） |
| `/welkatsu` | ウエル活・当日攻略特化（最短ルート・チェックリスト・レジ手順・地雷回避）。キャンペーン一覧は折りたたみ。アーカイブリンクあり |
| `/welkatsu/archive` | ウエル活過去分アーカイブ |

#### 2.1.4 コラム

- **一覧**: `/columns`
  - 新着順・ランキング（閲覧数）・カテゴリ別表示
  - タグ・カテゴリフィルタ、ページネーション
- **詳細**: `/columns/[slug]`
  - マークダウン/HTML 本文、サムネイル、著者、閲覧数
- **リクエスト**: `/columns/request`
  - 読者からコラムのテーマ・リクエストを送信（任意で reCAPTCHA v3）

#### 2.1.5 ポイ活横断検索

- **パス**: `/poikatsu-search`
- **概要**: キーワードでポイ活サイト横断検索（例: どこ得？連携）。
- **主な機能**:
  - キーワード検索・検索履歴（ローカルストレージ）
  - 結果の並び替え（還元率・還元額・サイト・タイトル）
  - サイトフィルタ
  - お気に入り保存（ローカル）
  - キャッシュによる高速表示
- **お気に入り一覧**: `/poikatsu-favorites`（ポイ活検索で保存したお気に入り）

#### 2.1.6 お気に入り（お得情報）

- **パス**: `/favorites`
- **概要**: お得詳細ページで「お気に入り」に追加した案件を一覧表示（ローカルストレージ連携）

#### 2.1.7 静的・制度ページ

| パス | 説明 |
|------|------|
| `/about` | アバウト・サービス説明 |
| `/policy` | ポリシー・利用規約等 |
| `/login` | 管理者ログイン（一般ユーザーは通常利用しない） |

#### 2.1.8 メンテナンスモード

- **パス**: `/maintenance`
- **概要**: 環境変数 `MAINTENANCE_MODE=1` のとき、一般ユーザーはトップ等から自動でこのページへリダイレクト。管理者は `/login` からログインすると全ページ閲覧可能（裏口）。

---

### 2.2 管理画面（管理者・編集者）

- **入口**: `/admin` → `/login` にリダイレクト。認証後 `/admin/dashboard` 等へ。
- **認証**: NextAuth（Credentials）。ユーザー名・パスワード。DB の `admin_users` または Google Sheets の `admin_users` シートで管理。

#### 2.2.1 ダッシュボード

- **パス**: `/admin/dashboard`
- **表示**: 公開/下書きコラム数、公開お得数、総閲覧数、最近のコラム・お得一覧

#### 2.2.2 コラム管理

- **一覧**: `/admin/columns`
- **新規作成**: `/admin/columns/new`
  - タイトル・スラッグ・概要・カテゴリ・タグ・サムネイル・本文（マークダウン/リッチエディタ）
  - ステータス: 下書き / 公開 / アーカイブ
- **編集**: `/admin/columns/[id]/edit`
- **API**: `GET/POST /api/admin/columns`、`GET/PATCH/DELETE /api/admin/columns/[id]`、画像アップロード `POST /api/admin/columns/upload-image`

#### 2.2.3 お得情報管理

- **一覧**: `/admin/deals`
- **編集**: `/admin/deals/[id]/edit`
- **API**: お得の取得・更新は既存の `deals-data` 経由。DB同期: `POST /api/admin/db-sync/deals`（要認証）

#### 2.2.4 その他管理機能

- アップロード: `POST /api/admin/upload`（管理用ファイルアップロード）
- DB がデータソースの場合、n8n 用 Ingest API でお得・コラムテーマ・コラムリクエストを投入可能

---

### 2.3 API 一覧

#### 2.3.1 公開API

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/deals` | お得一覧（公開のみ。検索・フィルタ・ページネーション） |
| GET | `/api/deals/[id]` | お得1件取得 |
| GET | `/api/poikatsu-search?q=` | ポイ活横断検索 |
| POST | `/api/poikatsu-save-viewed` | ポイ活閲覧履歴保存（任意） |
| GET | `/api/poikatsu-redirect` | ポイ活アフィリエイトリダイレクト用 |
| GET | `/api/column-requests` | コラムリクエスト一覧（公開用は必要に応じて） |
| GET | `/api/image-proxy` | 画像プロキシ（外部画像の安全表示用） |

#### 2.3.2 Ingest API（n8n 連携・要 API キー）

- **認証**: ヘッダー `x-api-key` を `N8N_API_KEY`（または `N8N_INGEST_API_KEY`）と一致で検証。
- **エンドポイント**:
  - `POST /api/ingest/deals` … お得情報の投入（複数件可）
  - `GET /api/ingest/deals/recent?days=7` … 重複チェック用の直近お得取得
  - `GET /api/ingest/column-themes` … コラムテーマ取得（`used` 等クエリ）
  - `POST /api/ingest/column-themes` … テーマ一括 UPSERT
  - `POST /api/ingest/column-themes/used` … テーマ使用済み更新
  - `POST /api/ingest/column-requests` … コラムリクエスト UPSERT
  - `POST /api/ingest/column-requests/status` … リクエストステータス更新
  - `GET /api/ingest/column-requests/[request_id]` … リクエスト1件取得
  - `GET /api/ingest/column-requests/status` … ステータス一覧

#### 2.3.3 認証付きAPI（管理画面用）

- NextAuth: `/api/auth/[...nextauth]`
- 管理用: `/api/admin/*`（セッション確認で保護）

---

## 3. データモデル概要

### 3.1 お得情報（Deal）

- **主要項目**: id, date, title, summary, detail, steps, service, expiration, conditions, notes
- **分類**: category_main, category_sub, is_public, priority（A/B/C）, score
- **割引**: discount_rate, discount_amount
- **フェーズ2**: difficulty, area_type, target_user_type, usage_type, is_welkatsu, tags
- **日時**: created_at, updated_at

### 3.2 コラム（Column）

- **主要項目**: id, slug, title, description, content_markdown, content_html, category, tags, thumbnail_url, author
- **状態**: status（published / draft / archived）, is_featured, view_count
- **日時**: created_at, updated_at, published_at

### 3.3 その他

- **admin_users**: 管理者アカウント（id, username, password_hash, role 等）
- **column_themes**: コラム自動生成用テーマ（no, level, theme, used, used_at）
- **column_requests**: コラム承認フロー用（request_id, source, status, original_text, themes_json 等）
- **migration_conflicts**: 移行時の競合記録用（任意）

---

## 4. データフロー・運用

### 4.1 お得情報の登録・更新

1. **手動**: Google スプレッドシートで直接編集、または管理画面で編集（DB の場合）
2. **自動**: n8n で X 等から収集 → LLM で構造化 → **Ingest API**（`POST /api/ingest/deals`）で DB に投入。スプレッドシートは使わない運用も可。
3. **一括**: CSV/Excel から DB へバックフィル（`scripts/db/backfill-from-xlsx.ts` 等）

### 4.2 コラムの登録・更新

1. **手動**: 管理画面（`/admin/columns`）で作成・編集。本文はマークダウンまたはリッチエディタ。
2. **自動**: n8n のコラム自動生成ワークフロー → テーマ取得（Ingest API）→ 生成 → 承認フロー（Slack 等）→ Ingest または管理画面で公開。

### 4.3 データソースの切替

- 環境変数 **`DEALS_DATA_SOURCE`**: `db` のとき PostgreSQL、未設定または `sheets` のとき Google Sheets を参照。
- コラムは DB または Google Sheets（`fetchColumnsFromSheet`）を利用。環境に応じて実装が分岐する場合あり。

---

## 5. 非機能要件・その他

- **SEO**: メタタグ・OGP・Twitter カード・canonical・構造化データ（WebSite, Organization, Article, Breadcrumb）を主要ページで設定。
- **サイトマップ**: `app/sitemap.ts` で動的生成。
- **OAuth2 コールバック**: `/oauth2callback`（Google 等の連携用）。
- **環境変数**: スプレッドシート/DB 接続、NextAuth、n8n API キー、reCAPTCHA、メンテナンスモードなど。詳細は `ENV_IMPORT_GUIDE.md` や `docs/CHECK_ENV_VARS.md` を参照。

---

## 6. ドキュメント参照

- セットアップ: `README.md`, `QUICK_START.md`, `docs/SETUP_SPREADSHEET.md`
- 管理画面: `docs/ADMIN_GUIDE.md`, `docs/ADMIN_SETUP.md`
- メンテナンス: `docs/MAINTENANCE_MODE.md`
- DB 移行・Ingest: `docs/DB_MIGRATION_PLAN.md`, `docs/N8N_DB_INGEST.md`
- コラム自動生成: `docs/COLUMN_AUTO_GENERATION.md`, `docs/COLUMN_WORKFLOW_SETUP.md`
- デプロイ: `DEPLOYMENT.md`, `docs/VERCEL_MANUAL_DEPLOY.md`

---

*本ドキュメントは、TokuSearch の概要と機能を説明するために作成されています。実装の詳細はソースコードおよび上記ドキュメントを参照してください。*
