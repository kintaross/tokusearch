# WebhookTrigger動作しない問題の修正手順

## 問題の原因

コラムリクエストが動作していない原因は、n8nのWebhookTriggerノードの設定と環境変数のURLが一致していない可能性があります。

## 修正手順

### ステップ1: n8nワークフローでWebhook URLを確認

1. n8nのWeb UIを開く
2. 「コラムテーマ作成と承認ワークフロー（Slack + Web連携）」を開く
3. **WebhookTriggerノードをクリックして開く**
4. **「Listen for Test Event」ボタンの下に表示されているWebhook URLをコピー**
   - 通常、`https://k-n8n.xvps.jp/webhook/xxx` の形式
   - このURLが**実際に動作するWebhook URL**です

### ステップ2: 環境変数を更新

確認したWebhook URLを環境変数に設定：

#### Vercelダッシュボードで設定

1. Vercelダッシュボードを開く
2. プロジェクト → Settings → Environment Variables
3. `N8N_WEBHOOK_URL`を探す（なければ追加）
4. 値をステップ1で確認したWebhook URLに更新
5. すべての環境（Production, Preview, Development）に設定
6. 保存

#### または、Vercel CLIで設定

```bash
vercel env add N8N_WEBHOOK_URL production
# プロンプトが表示されたら、ステップ1で確認したWebhook URLを入力

vercel env add N8N_WEBHOOK_URL preview
# 同じURLを入力

vercel env add N8N_WEBHOOK_URL development
# 同じURLを入力
```

### ステップ3: ワークフローが有効になっているか確認

1. n8nワークフロー画面の右上に「Active」と表示されているか確認
2. 「Inactive」になっている場合は、スイッチをクリックして有効化

### ステップ4: Webhook URLをテスト

ターミナルでWebhook URLを直接テスト：

```bash
curl -X POST https://k-n8n.xvps.jp/webhook/実際のパス \
  -H "Content-Type: application/json" \
  -d '{"requestText": "テストリクエスト", "source": "web", "timestamp": "2024-01-01T00:00:00.000Z"}'
```

**期待される結果:**
- HTTP 200 OK が返る
- n8nワークフローの「Executions」タブに実行履歴が表示される

### ステップ5: 再デプロイ

環境変数を更新したら、Vercelを再デプロイ：

```bash
vercel --prod --yes
```

### ステップ6: 動作確認

1. コラムリクエストページ（`/columns/request`）を開く
2. リクエストを送信
3. n8nワークフローの「Executions」タブで実行履歴を確認
4. Slackで通知が届くことを確認

## よくある問題

### 問題1: WebhookTriggerノードにWebhook URLが表示されない

**原因:**
- ワークフローが無効になっている
- WebhookTriggerノードが正しく設定されていない

**解決策:**
1. ワークフローを有効化
2. WebhookTriggerノードを削除して再作成
3. `path`パラメータを設定（例: `column-request-webhook`）
4. ワークフローを保存

### 問題2: 環境変数を更新しても動作しない

**原因:**
- 再デプロイしていない
- 環境変数が間違った環境に設定されている

**解決策:**
1. Vercelを再デプロイ: `vercel --prod --yes`
2. すべての環境（Production, Preview, Development）に環境変数を設定

### 問題3: Webhook URLは正しいが、ワークフローが実行されない

**原因:**
- WebhookTriggerノードから次のノードへの接続が切れている
- ExtractWebhookRequestノードでエラーが発生している

**解決策:**
1. n8nワークフローでWebhookTrigger → ExtractWebhookRequest の接続を確認
2. ワークフローの実行ログでエラーを確認


