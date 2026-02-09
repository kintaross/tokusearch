# WebhookTrigger動作しない問題の調査手順

## 問題
コラムリクエストが動作していない（WebhookTriggerが動作していない）

## 調査手順

### 1. n8nワークフローの確認

1. n8nのWeb UIを開く
2. 「コラムテーマ作成と承認ワークフロー（Slack + Web連携）」を開く
3. WebhookTriggerノードを開く
4. **実際のWebhook URL**が表示されているか確認
   - 通常、`https://k-n8n.xvps.jp/webhook/column-request-webhook` の形式
5. ワークフローが**有効（Active）**になっているか確認

### 2. 環境変数の確認

Vercelの環境変数で`N8N_WEBHOOK_URL`が正しく設定されているか確認：

```bash
# Vercel CLIで確認
vercel env ls
```

または、Vercelダッシュボードで確認：
- Settings → Environment Variables → `N8N_WEBHOOK_URL`
- 値: `https://k-n8n.xvps.jp/webhook/column-request-webhook`

### 3. Webhook URLのテスト

ターミナルでWebhook URLを直接テスト：

```bash
curl -X POST https://k-n8n.xvps.jp/webhook/column-request-webhook \
  -H "Content-Type: application/json" \
  -d '{"requestText": "テストリクエスト", "source": "web", "timestamp": "2024-01-01T00:00:00.000Z"}'
```

**期待される結果:**
- HTTP 200 OK が返る
- n8nワークフローが実行される

**もし404エラーが返る場合:**
- Webhook URLが間違っている
- WebhookTriggerノードが正しく設定されていない
- ワークフローが無効になっている

### 4. n8nワークフローの実行ログ確認

1. n8nのWeb UIを開く
2. 「Executions」タブを開く
3. 最近の実行履歴を確認
4. WebhookTriggerが実行されているか確認

### 5. Vercelのログ確認

VercelダッシュボードでAPIログを確認：

1. Vercelダッシュボードを開く
2. プロジェクト → 「Logs」タブ
3. `/api/column-requests`のログを確認
4. Webhook呼び出しのエラーログを確認

## よくある問題と解決策

### 問題1: Webhook URLが404エラーを返す

**原因:**
- n8nワークフローが無効になっている
- WebhookTriggerノードの`path`パラメータが間違っている
- Webhook URLが間違っている

**解決策:**
1. n8nワークフローを有効化する
2. WebhookTriggerノードを開いて、実際のWebhook URLを確認
3. 環境変数`N8N_WEBHOOK_URL`を実際のWebhook URLに更新

### 問題2: Webhookは呼び出されるがワークフローが実行されない

**原因:**
- WebhookTriggerノードから次のノードへの接続が切れている
- ワークフロー内でエラーが発生している

**解決策:**
1. n8nワークフローでWebhookTriggerノードからExtractWebhookRequestノードへの接続を確認
2. ワークフローの実行ログでエラーを確認

### 問題3: 環境変数が設定されていない

**原因:**
- Vercelの環境変数が設定されていない
- 環境変数名が間違っている

**解決策:**
1. Vercelダッシュボードで環境変数を確認
2. `N8N_WEBHOOK_URL`が正しく設定されているか確認
3. 設定されていない場合は追加

## デバッグ用のテストエンドポイント

以下のエンドポイントでWebhook URLをテストできます：

```
GET /api/column-requests/test?url={webhookUrl}
```

ただし、これは実装していないので、直接curlでテストしてください。

## 次のステップ

1. 上記の調査手順に従って問題を特定
2. 問題が見つかったら修正
3. 修正後、再度テスト


