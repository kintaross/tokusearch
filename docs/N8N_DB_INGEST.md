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
- `POST /api/ingest/welkatsu-playbooks`（ウエル活当日攻略 playbook の upsert。詳細は [N8N_WELKATSU_PLAYBOOK.md](N8N_WELKATSU_PLAYBOOK.md)）

### 認証

- Header: `x-api-key: <N8N_API_KEY>`
- アプリ側は `N8N_API_KEY`（または `N8N_INGEST_API_KEY`）と**厳密一致**で検証します。

---

## 1.5) n8n側で N8N_API_KEY をどこに入力するか

ワークフローは **`$env.N8N_API_KEY`** を参照しているため、n8n の **環境変数** に同じ名前で設定します。

### n8n Cloud の場合

1. 左メニュー **Settings**（歯車アイコン）を開く
2. **Variables** または **Environment variables** を開く
3. **Add variable** で以下を追加
   - **Key**: `N8N_API_KEY`
   - **Value**: （Vercel に設定したのと同じ値、例: `cXajM21jtiFiCYqrRtqOeQ3bcPLB5JJ5-Nr4lQTXTtQ`）
4. 保存後、ワークフローを再実行（または n8n を再起動してから実行）

### セルフホスト（Docker / 手動起動）の場合

- **Docker**: `docker run` や `docker-compose.yml` の `environment` に  
  `N8N_API_KEY=cXajM21jtiFiCYqrRtqOeQ3bcPLB5JJ5-Nr4lQTXTtQ` を追加
- **手動起動**: 起動前にシェルで  
  `export N8N_API_KEY="cXajM21jtiFiCYqrRtqOeQ3bcPLB5JJ5-Nr4lQTXTtQ"`  
  または `.env` に `N8N_API_KEY=...` を書いてから n8n を起動

※ 値は Vercel の `N8N_API_KEY` と **完全に同じ** にしてください。違うと Ingest API が 401 を返します。

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
- **ウエル活当日攻略（DB版）**: `n8n_workflow/welkatsu-playbook-db-ingest.json`（[N8N_WELKATSU_PLAYBOOK.md](N8N_WELKATSU_PLAYBOOK.md) 参照）

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

