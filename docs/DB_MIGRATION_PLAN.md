# DB移行計画（詳細）

本書は、現行の **Google Sheets中心のデータ運用** から **DB（PostgreSQL想定）** へ安全に移行するための実行計画です。  
ユーザー影響を最小化し、**実現可否の根拠** と **現データ取り扱い（欠損/型/重複/ID）**、および **切替/ロールバック** まで含めて定義します。

---

## 1. 結論（実現可否）

- **結論**: **実現可能**（Next.js 14 + Vercel運用前提で、Vercel Postgres または同等Postgresで実施可能）
- **難易度**: 中（データ層の抽象化、n8n書き込み経路の変更、移行時の整合性検証が必要）
- **停止時間**: 原則ゼロ（ただし切替時に *短い凍結ウィンドウ* を推奨）
- **最大リスク**: 「二重管理/データドリフト」「ID/重複」「型（`TRUE`/`null`文字列など）の混在」「n8nの直接Sheets書き込み」

---

## 2. 現状整理（データ棚卸し）

### 2.1 サーバ側データ（移行対象）

- **お得情報（deals）**
  - **読取**: `lib/sheets.fetchDealsFromSheet()`
  - **書込（管理画面）**: `PUT /api/deals/[id]` → `lib/sheets.updateDeal()`
  - **書込（自動収集）**: n8nが **Google Sheetsへ直接append**（`SaveToHistory`等のGoogleSheetsノード）
- **コラム（columns）**
  - **読取/書込**: `lib/columns.ts`（Sheetsの`columns`タブをCRUD）
  - **閲覧数**: `app/columns/[slug]/page.tsx` で `lib/columns.incrementViewCount()`（Sheets更新）
- **管理ユーザー（admin_users）**
  - **読取/書込**: `lib/admin-auth.ts`（Sheetsの`admin_users`タブ、最終ログイン更新含む）

### 2.2 クライアント側データ（移行対象外：注意点のみ）

- **お気に入り/閲覧数/検索履歴（deals）**: `lib/storage.ts`（localStorage）
  - **移行しない理由**: 利用者（一般ユーザー）のログインが無く、ブラウザローカルの個人データであるため
  - **注意**: DB化しても、ユーザー端末のlocalStorageはそのまま残る（サーバ側へ統合したい場合は“ユーザーアカウント導入”が別途必要）

---

## 3. 移行方針（ゼロダウンタイムの基本戦略）

**原則**: 「先にDBを用意 → バックフィル → 並走（dual-write/feature flag） → 最終同期 → 読取切替 → 退避/廃止」の順で進めます。

- **Feature Flag（データソース切替）** を実装し、エンティティ単位で以下を切替可能にする
  - `sheet`（現行）
  - `db`（新）
  - `dual`（読取はsheet優先/DB検証、書込は両方 等、段階的に定義）
- **ロールバック** は “フラグを `sheet` に戻すだけ” を最終目標にする

---

## 4. DBスキーマ（提案・確定版は移行開始前にFIX）

### 4.1 deals（公開お得情報）

現行の `types/deal.ts` を基準としつつ、**将来の整合性向上** のために “収集元情報” もDBでは保持可能にします。

推奨（例）:

- `deals`
  - `id` TEXT PRIMARY KEY（既存IDを維持）
  - `date` DATE NOT NULL
  - `title` TEXT NOT NULL
  - `summary/detail/steps/conditions/notes` TEXT
  - `service` TEXT
  - `expiration` TEXT（現状テキスト混在のためDATEに寄せない。別途正規化するなら`expiration_date`併設）
  - `category_main` TEXT NOT NULL（enum化は後段でも可）
  - `category_sub` TEXT NULL
  - `is_public` BOOLEAN NOT NULL DEFAULT true
  - `priority` CHAR(1) NOT NULL DEFAULT 'C'
  - `discount_rate` NUMERIC(6,2) NULL
  - `discount_amount` INTEGER NULL
  - `score` INTEGER NOT NULL DEFAULT 0
  - `created_at` TIMESTAMPTZ NOT NULL
  - `updated_at` TIMESTAMPTZ NOT NULL
  - `difficulty/area_type/target_user_type/usage_type/is_welkatsu/tags`（現行に合わせて追加）
  - （任意）`source_url/source_name/source_id`：n8n履歴/notesから抽出できるなら格納（重複排除・品質改善に効く）

インデックス（最低限）:
- `(is_public, created_at DESC)`
- `(category_main, created_at DESC)`
- `(priority, created_at DESC)`
- `GIN(to_tsvector('japanese', title || ' ' || summary || ' ' || detail || ' ' || notes))`（検索をDBに寄せる場合）

### 4.2 columns（コラム）

- `columns`
  - `id` TEXT PRIMARY KEY（`col-...` 維持）
  - `slug` TEXT UNIQUE
  - `title/description/content_markdown/content_html/tags/thumbnail_url/author` 等
  - `status` TEXT
  - `is_featured` BOOLEAN
  - `view_count` INTEGER
  - `created_at/updated_at/published_at` TIMESTAMPTZ

### 4.3 admin_users（管理ユーザー）

Sheetsの`admin_users`をそのまま移す:
- `admin_users`
  - `id` TEXT PRIMARY KEY
  - `username` TEXT UNIQUE
  - `password_hash` TEXT（bcrypt）
  - `display_name/email/role`
  - `created_at/last_login` TIMESTAMPTZ

---

## 5. 現データの取り扱い（重要）

### 5.0 実データ（`TokuSearch.xlsx`）から判明した注意点（2026-01-05時点）

`debug/xlsx-summary.json`（xlsx解析結果）より:

- `database`（deals）: **265件**（ヘッダー除く）
  - **ID重複あり**: 265件中 **ユニーク253**（= 重複行が12件分存在）
  - booleanの揺れ: `is_public` が `TRUE/true`、`is_welkatsu` が `TRUE/FALSE/true/false`
  - `'null'`（文字列）混入: `conditions` に1件
- `columns`: データ行 **333件**（空行が多数あり）
  - ヘッダーの2列目が誤って `id` になっている（実値は `slug` 相当）
- `admin_users`: **2件**
  - **usernameが重複**（`admin` が2行）→ DBでは `username UNIQUE` を張りたいので **移行前に解決必須**
- シート名の異常: `viewed_items` と `viewed_items\\r\\n` が併存（末尾改行付きのシート名）

上記は移行時の失敗要因になるため、**バックフィル時の重複解決** と **制約（UNIQUE）の張り方** を本書の後段で明示します。

### 5.1 型の正規化ルール（バックフィル/インジェスト共通）

- **boolean**
  - Sheetsの`TRUE/FALSE`（文字列）→ boolean
- **null**
  - `null`（JSONのnull）/ `''`（空文字）/ `'null'`（文字列） を **NULL** に統一（ただし `expiration` は仕様上文字列を許すため空文字=未設定としてNULL扱い）
- **number**
  - `discount_rate/discount_amount/score/view_count` は数値化できない場合 **NULL** または **0**（項目定義に従う）
  - `discount_amount` は整数、`discount_rate` は小数許容
- **timestamp**
  - `created_at/updated_at` が欠損なら、暫定で `date` の 00:00:00Z を生成（欠損率をレポートし後で改善）

### 5.2 ID/重複の扱い

- **IDは再生成しない**（既存の `deal.id` を主キーとして保持）
- n8n側は既に “決定的ID（URL由来など）” の改善版が存在するが、過去データはUUID等が混在しうる
  - 追加で `source_url` をDBへ格納できれば、将来の重複統合が安全に可能
  - 移行初期は「現行IDのまま」運用し、**重複統合は後工程** とする（移行の爆発を防ぐ）

**重要（実データ対応）**: `database`に **同一 `id` の行が複数存在**するため、DBへ投入する際に以下のいずれかを必ず選択する。

- **方式A（推奨: “最後勝ち”で正規化）**  
  `id` を主キーにして、同一 `id` は **`updated_at` が最新の行を採用**し、他は `migration_conflicts`（ログ）へ退避。
  - メリット: DBの `PRIMARY KEY(id)` を維持でき、アプリの前提（idで参照）も崩れない
  - デメリット: 退避行のレビューが必要
- **方式B（暫定: サロゲートキー導入）**  
  `deals` に `pk SERIAL/UUID` を追加し、`id` は UNIQUEを貼らずに保持（アプリ側も `id` 前提を変更する必要が出るため非推奨）。

このプロジェクトは `deal.id` がURLにも使われているため、基本は **方式A** を採用する。

**admin_usersの重複**についても同様に、`username UNIQUE` の前提を守るために:
- `last_login` または `created_at` が最新の行を採用し、他を退避（監査ログ化）する。

### 5.3 履歴データ（n8nのHistory Log）

現状、n8nは「配信済み/過去履歴」を別スプレッドシートへappendして重複排除に使っています。

- 移行案:
  - **案A（推奨）**: `deal_ingest_history` テーブルに置き換え（URL/日付/タイトル/ハッシュ等）
  - **案B（暫定）**: historyは当面Sheetsのまま（dealsのみDB化）。ただし重複判定が二系統になりやすい

移行計画では、最低でも **n8nの重複排除が壊れない** ことを保証する。

---

## 6. 書き込み経路の移行（ここが成否を分ける）

### 6.1 管理画面（deals編集）

現状: `PUT /api/deals/[id]` → Sheets更新  
移行後:
- `PUT /api/deals/[id]` は **DB更新** に切替
- 並走期間は **DB更新 + Sheets更新（ミラー）** を行う（ロールバックの保険）

### 6.2 n8n（自動収集）

現状: n8nがGoogle Sheetsへ直接append  
移行後（推奨）:
- n8n → **HTTP Request** でアプリの **Ingest API** を呼ぶ（DBにUPSERT）【A案】
  - **エンドポイント**: `POST /api/ingest/deals`
  - **認証**: Header `x-api-key: <N8N_API_KEY>`（アプリ側で厳密一致）
  - **Body**: `TransformForTokuSearch` の出力（`id/title/...` を含むDealオブジェクト、または配列）
- 既存の「Google Sheets append」ノードは **停止/削除**（DBが更新されなくなるため）
- DBへ直書き（n8n Postgresノード）は可能だが、権限/監査/スキーマ変更耐性の点で **API経由が安全**

**注意**: 現在の `/api/admin/columns` は `x-api-key` の一致検証が弱い可能性があるため、DB移行のタイミングで **“一致必須”** に揃える（セキュリティ要件）。

### 6.3 columns/admin_users

deals移行が安定した後に段階移行する（Phaseを分ける）。

---

## 7. 移行ステップ（フェーズ別）

### Phase 0: 事前準備（1〜2日）

- DB選定（Vercel Postgres推奨）
- 環境変数整備（接続文字列、読み取りユーザー等）
- 「どのSheetタブが本番データか」を確定
  - `GOOGLE_SHEETS_SHEET_NAME` の値
  - n8nがappendしているタブ名（例: `database` / `records` 等）
- 受入基準（後述）を合意

### Phase 1: DBスキーマ作成（半日）

- `deals`（+必要なら `deal_ingest_history`）を作成
- 最低限のインデックス作成
- DB側で `id` の一意性を保証

### Phase 2: アプリにデータソース切替層を導入（1〜2日）

- 例: `lib/deals-repo.ts` を作り、`getDeals/getDealById/updateDeal` を抽象化
- envフラグ:
  - `DEALS_DATA_SOURCE=sheet|db|dual`
- `dual` モード:
  - 読取: sheetを返しつつDBにも同条件でクエリし、差分をログ/メトリクス化（ユーザー影響なし）
  - 書込: DB + Sheets（ミラー）

### Phase 3: 一括移行（短い凍結ウィンドウ）（0.5〜1日）

**稼働中システム前提**のため、一括移行でも「最新状態」を担保するには **凍結** が必要です。

- **凍結ウィンドウ: 1時間（確定）**
  - 目的: n8n/管理編集による“書き込み”を止め、**最新データを確定した状態でDBへ投入→切替**までを完了する

- **凍結（freeze）**
  - n8nワークフローを一時停止（次の自動実行が走らないようにする）
  - 管理画面での編集を停止（告知）
- **最新データの確定**
  - n8nが定期実行されるなら、実行直後に凍結して **最新状態のxlsx/Sheets** を確定する
  - その後、`TokuSearch.xlsx`（またはSheetsエクスポート）を取得
- **投入**
  - 型の正規化（TRUE/true、'null'文字列等）
  - 重複解決（`database`の同一`id`、`admin_users`の同一`username`）
    - 採用ルール: **updated_at/last_login が最新の行を採用、他は退避**
  - DBへ投入（INSERT/UPSERT）
- **検証**
  - 件数一致、特定IDの表示、管理画面の最小動作確認
- **切替**
  - 読み取り/書き込みの参照先をDBへ切替（※この切替自体は別フェーズで実施）

#### 1時間Runbook（目安）

- **T-00:00〜T-00:05**
  - n8n停止（次回のスケジュール実行が走らない状態にする）
  - 管理画面の編集停止（告知/アクセス制御）
- **T-00:05〜T-00:20**
  - Sheetsをxlsxでエクスポート（例: `TokuSearch.xlsx`）
  - エクスポートしたxlsxをこのリポジトリに配置（またはバックフィル環境へコピー）
- **T-00:20〜T-00:40**
  - DBに `scripts/db/schema.sql` を適用
  - バックフィル（重複解決込み）を実行
  - 退避ログ（conflicts）を確認（少なくとも件数だけ確認）
- **T-00:40〜T-00:55**
  - 受入基準の最小確認（件数、特定IDページ、管理画面の基本動作）
  - 切替（`DEALS_DATA_SOURCE=db` 等）
- **T-00:55〜T-01:00**
  - n8n再開（必要ならDB ingestへ切替、当面は停止解除のみでも可）
  - 監視開始（ログ/エラー率）

### Phase 4: 並走運用（任意）

ユーザー要望により、基本は **一括移行で完了** とする。  
ただし、切替に不安がある場合のみ `dual` を短期間入れる（任意）。

### Phase 5: 切替（凍結を推奨）

- 凍結手順（推奨）
  - n8n実行を一時停止
  - 管理画面の編集を一時停止（告知）
  - 最終同期（Sheets→DB差分取り込み）
  - `DEALS_DATA_SOURCE=db` に変更
  - 監視・動作確認
  - n8n再開（DB ingestへ）

### Phase 6: ロールバック準備期間（最低1週間）

- Sheetsは **読み取り可能なバックアップ** として保持
- 不具合時は `DEALS_DATA_SOURCE=sheet` に戻すだけで復旧可能
- 安定後、Sheets更新（ミラー）を停止してコスト削減

---

## 7.1 受入基準（成功条件）

最低限:
- 公開deals件数が一致（±0、または仕様上の除外を明文化）
- `/api/deals` のレスポンスが同等（フィルタ/ソート/ページネーション）
- `/deals/[id]` が同じIDで表示できる
- 管理画面の更新（PUT）が反映される

推奨:
- `dual` 期間中の差分が継続的にゼロに近い
- n8n ingestion がDBに対して安定している（リトライ/冪等性あり）

---

## 8. ロールバック計画（必須）

ロールバックは「**トグルで戻す**」が原則。

- **即時復旧**:
  - `DEALS_DATA_SOURCE=sheet` に変更して再デプロイ（または環境変数反映）
- **データ損失防止**:
  - 並走期間は書込をDB+Sheetsにする（どちらかが落ちても片方に残る）
  - `db` 切替後も一定期間はミラーを継続（保険）

---

## 9. タスク分解（次にやること）

1. **本番で使っているSheetタブ名の確定**（`GOOGLE_SHEETS_SHEET_NAME` と n8nの書込み先が一致しているか）
2. DBを **Vercel Postgres** で用意（推奨）
3. `deals` のスキーマ確定（source情報を入れるかどうか）
4. アプリ側に `DEALS_DATA_SOURCE` を導入（repo層）
5. バックフィルスクリプト作成（Sheets→DB）
6. n8nを **Ingest API** に切替（冪等UPSERT、APIキー一致必須）

