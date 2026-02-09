# WebhookTrigger動作しない問題の修正手順

## 問題の原因

curlでテストした結果、以下のエラーが返りました：

```
{"code":404,"message":"The requested webhook \"POST column-request-webhook\" is not registered.","hint":"The workflow must be active for a production URL to run successfully."}
```

これは、**n8nワークフローが無効になっている**か、**Webhookが正しく登録されていない**ことを示しています。

## 修正手順

### ステップ1: n8nワークフローを有効化

1. n8nのWeb UIを開く
2. 「コラムテーマ作成と承認ワークフロー（Slack + Web連携）」を開く
3. **ワークフロー画面の右上にあるスイッチを確認**
   - 「Active」になっているか確認
   - 「Inactive」になっている場合は、スイッチをクリックして有効化
4. ワークフローを保存

### ステップ2: WebhookTriggerノードのProduction URLを確認

1. **WebhookTriggerノードをクリックして開く**
2. 「Production URL」のセクションを確認
3. 表示されているURLをコピー
   - 通常、`https://k-n8n.xvps.jp/webhook/xxx` の形式
   - このURLが**実際に動作するWebhook URL**です

### ステップ3: 環境変数を更新

1. ステップ2で確認したProduction URLをコピー
2. Vercelダッシュボードを開く
3. プロジェクト → Settings → Environment Variables
4. `N8N_WEBHOOK_URL`を探す
5. 値をステップ2で確認したProduction URLに更新
6. すべての環境（Production, Preview, Development）に設定
7. 保存

### ステップ4: 再デプロイ

環境変数を更新したら、Vercelを再デプロイ：

```bash
vercel --prod --yes
```

### ステップ5: 動作確認

1. コラムリクエストページ（`/columns/request`）を開く
2. リクエストを送信
3. n8nワークフローの「Executions」タブで実行履歴を確認
4. Slackで通知が届くことを確認

## 重要なポイント

- **Production URL**と**Test URL**は異なります
- ワークフローが有効になっている必要があります
- Production URLは、ワークフローが有効になっている場合のみ利用可能です

## エラーが続く場合

もし上記の手順を実行してもエラーが続く場合は、以下を確認してください：

1. n8nインスタンスが正常に動作しているか
2. WebhookTriggerノードの設定が正しいか（`path`パラメータが設定されているか）
3. ワークフローの接続が正しいか（WebhookTrigger → ExtractWebhookRequest）


