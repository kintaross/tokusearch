# WebhookTrigger動作しない問題のトラブルシューティング

## 確認手順

### 1. n8nワークフローでの確認

1. n8nのWeb UIを開く
2. 「コラムテーマ作成と承認ワークフロー（Slack + Web連携）」を開く
3. **WebhookTriggerノードをクリック**
4. 「Listen for Test Event」ボタンの下に表示されているWebhook URLを確認
5. そのURLをコピー

**期待される形式:**
```
https://k-n8n.xvps.jp/webhook/column-request-webhook
```

### 2. Vercel環境変数の確認

1. Vercelダッシュボードを開く
2. プロジェクト → Settings → Environment Variables
3. `N8N_WEBHOOK_URL`の値を確認
4. ステップ1で確認したWebhook URLと一致しているか確認

### 3. ワークフローの有効化確認

1. n8nワークフロー画面の右上を確認
2. 「Active」と表示されているか確認
3. 「Inactive」の場合は、スイッチをクリックして有効化

### 4. Webhook URLの直接テスト

ターミナルでWebhook URLを直接テスト：

```bash
curl -X POST https://k-n8n.xvps.jp/webhook/column-request-webhook \
  -H "Content-Type: application/json" \
  -d '{"requestText": "テスト", "source": "web", "timestamp": "2024-01-01T00:00:00.000Z"}'
```

**期待される結果:**
- HTTP 200 OK が返る
- n8nワークフローの「Executions」タブに実行履歴が表示される

**404エラーの場合:**
- Webhook URLが間違っている
- ワークフローが無効になっている
- WebhookTriggerノードが正しく設定されていない

### 5. Vercelログの確認

1. Vercelダッシュボードを開く
2. プロジェクト → 「Logs」タブ
3. `/api/column-requests`のログを確認
4. エラーメッセージを確認

## よくある問題と解決策

### 問題1: Webhook URLが404エラーを返す

**原因:**
- n8nワークフローが無効になっている
- Webhook URLが間違っている

**解決策:**
1. n8nワークフローを有効化
2. WebhookTriggerノードを開いて、実際のWebhook URLを確認
3. 環境変数を実際のWebhook URLに更新
4. Vercelを再デプロイ

### 問題2: 環境変数が設定されていない

**原因:**
- Vercelの環境変数が設定されていない

**解決策:**
1. Vercelダッシュボードで環境変数を確認
2. `N8N_WEBHOOK_URL`が設定されているか確認
3. 設定されていない場合は追加
4. すべての環境（Production, Preview, Development）に設定
5. Vercelを再デプロイ

### 問題3: Webhookは呼び出されるがワークフローが実行されない

**原因:**
- WebhookTriggerノードから次のノードへの接続が切れている
- ワークフロー内でエラーが発生している

**解決策:**
1. n8nワークフローでWebhookTrigger → ExtractWebhookRequest の接続を確認
2. ワークフローの実行ログでエラーを確認


