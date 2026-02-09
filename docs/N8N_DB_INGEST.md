# n8n → DB（A案: Ingest API）切替手順

DB移行後は、n8nが **Google Sheetsに書き込み続ける** とDB側が更新されず陳腐化します。  
そのため、n8nの **3ワークフロー** を「Google Sheetsノードなし（HTTPでAPI呼び出し）」に切り替えます。

---

## 1) アプリ側の準備

### エンドポイント

- `POST /api/ingest/deals`
- `GET /api/ingest/deals/recent?days=7`（重複チェック用の履歴参照。`days` は 1〜30 でクランプ）
- `GET /api/ingest/column-themes?used=false&limit=1000`
- `POST /api/ingest/column-themes`（テーマ一括UPSERT）
- `POST /api/ingest/column-themes/used`（テーマ使用済み更新）
- `POST /api/ingest/column-requests`（承認リクエストUPSERT）
- `POST /api/ingest/column-requests/status`（ステータス更新）

### 認証

- Header: `x-api-key: <N8N_API_KEY>`
- アプリ側は `N8N_API_KEY`（または `N8N_INGEST_API_KEY`）と**厳密一致**で検証します。

---

## 2) n8n側の変更（ノード差し替え）

### やること

- 既存の「Google Sheets」ノードを **無効化/削除**
- 代わりに「HTTP Request」ノードで、以下のAPIを呼びます（Header `x-api-key: {{$env.N8N_API_KEY}}`）
  - お得情報: `POST /api/ingest/deals` + `GET /api/ingest/deals/recent`
  - コラム自動生成: `GET/POST /api/ingest/column-themes` + `POST /api/ingest/column-themes/used`
  - コラム承認: `POST /api/ingest/column-requests` + `POST /api/ingest/column-requests/status`

### 使うワークフローJSON（このリポジトリ内）

- **お得情報（DB版）**: `n8n_workflow/deals-workflow-db-ingest.json`
- **コラム自動生成（DB版）**: `n8n_workflow/columns-auto-noimage-db.json`
- **コラム承認（DB版）**: `n8n_workflow/column-approval-db.json`

### HTTP Request（例）

- **Method**: `POST`
- **URL**: `https://<your-domain>/api/ingest/deals`
- **Headers**:
  - `Content-Type: application/json`
  - `x-api-key: <N8N_API_KEY>`
- **Body**:
  - `TransformForTokuSearch` の出力（Dealオブジェクト）
  - 複数件なら配列のまま送ってOK（最大500件）

---

## 3) 移行当日の運用（1時間freeze前提）

1. n8n停止
2. DBへバックフィル & アプリ切替（参照先をDBへ）
3. n8nワークフローの最終ノードを **Ingest API** に差し替え
4. n8n再開

