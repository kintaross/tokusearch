# n8n Webhook URL設定ガイド

## 概要

コラムリクエスト機能で使用するn8n Webhook URLの設定方法です。

## 設定方法

### 方法1: 自動スクリプトで設定（推奨）

```bash
node scripts/add-n8n-webhook-env.js
```

このスクリプトは以下を実行します：
- `.env.local`ファイルが存在しない場合は新規作成
- 既に`N8N_WEBHOOK_URL`が設定されている場合は更新
- 設定されていない場合は追加

### 方法2: 手動で設定

`.env.local`ファイルを開き、以下の行を追加または更新してください：

```env
# n8n Webhook URL (コラムリクエスト用)
N8N_WEBHOOK_URL=https://k-n8n.xvps.jp/webhook/column-request-webhook
```

**重要**: ファイルの最後に追加してください。

## 設定内容

- **Webhook URL**: `https://k-n8n.xvps.jp/webhook/column-request-webhook`
- **説明**: n8nワークフローの`WebhookTrigger`ノードで設定されたWebhookエンドポイント
- **ワークフロー**: `コラムテーマ作成と承認ワークフロー（Slack + Web連携）`

## 動作確認

設定後、以下の手順で動作確認を行ってください：

1. **開発サーバーを再起動**
   ```bash
   npm run dev
   ```

2. **コラムリクエストページにアクセス**
   - URL: `http://localhost:3000/columns/request`

3. **フォームからリクエストを送信**
   - テキストエリアに任意の内容を入力
   - 「リクエストを送信」ボタンをクリック

4. **成功メッセージが表示されることを確認**
   - 「リクエストを受け付けました！」と表示されれば成功

5. **n8nワークフローの実行を確認**
   - n8nのダッシュボードでワークフローが実行されていることを確認
   - Slackでテーマ案の承認依頼が表示されることを確認

## トラブルシューティング

### エラー: "N8N_WEBHOOK_URL is not configured"

**原因**: 環境変数が設定されていない、またはサーバーが再起動されていない

**解決方法**:
1. `.env.local`ファイルに`N8N_WEBHOOK_URL`が正しく設定されているか確認
2. 開発サーバーを再起動（`Ctrl+C`で停止後、`npm run dev`で再起動）

### Webhookが呼び出されない

**原因**: n8nのWebhook URLが正しくない、またはn8nワークフローが無効

**解決方法**:
1. n8nのワークフローが有効になっているか確認
2. `WebhookTrigger`ノードのWebhook URLが正しいか確認
3. n8nのログでWebhookが受信されているか確認

### 403 Forbidden エラー

**原因**: n8nのWebhookが認証を要求している、またはワークフローが無効

**解決方法**:
1. n8nのワークフローが有効になっているか確認
2. Webhookの認証設定を確認（通常は認証不要）
3. n8nのWebhook URLが正しいか確認

## Vercel（本番環境）への設定

本番環境でも同様に環境変数を設定する必要があります：

1. **Vercelダッシュボードを開く**
   - https://vercel.com/dashboard にアクセス
   - プロジェクトを選択

2. **環境変数を追加**
   - 「Settings」→「Environment Variables」を開く
   - 以下の環境変数を追加：
     - **Name**: `N8N_WEBHOOK_URL`
     - **Value**: `https://k-n8n.xvps.jp/webhook/column-request-webhook`
     - **Environment**: `Production`, `Preview`, `Development` を全て選択

3. **再デプロイ**
   - 環境変数を追加後、再デプロイを実行
   - 「Deployments」タブから「Redeploy」をクリック

## 参考情報

- [フロントエンド 本番リリース手順書](./FRONTEND_DEPLOYMENT.md)
- [コラムテーマ作成と承認ワークフロー](./SLACK_COLUMN_THEME_APPROVAL_WORKFLOW.md)


